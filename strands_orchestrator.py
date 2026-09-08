"""Real Strands Agents orchestration boundary for Hermes AI.

The deterministic Hermes policy is an authorization boundary, not a suggestion.
When both the Strands SDK and a configured model provider are available, this
module runs a real Strands Agent with guarded tools and records tool lifecycle
metadata through a callback handler. When the SDK or provider is unavailable,
it returns an explicitly labelled result; it never presents the deterministic
preflight as a live model invocation.

Supported providers:

* ``bedrock`` (default): requires the Strands Bedrock provider, AWS access and
  the explicit ``HERMES_STRANDS_ALLOW_CLOUD=true`` privacy opt-in.
* ``ollama``: requires the Strands Ollama extra, a running local Ollama server
  and a pulled tool-capable model.

No tool in this module has credentials or an external side effect. The model
can inspect the request and prepare a local draft, but it cannot pay, book,
send, delete, sign, edit a health record or call a smart-home system.
"""
from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import asdict
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Union
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from everyday_agent import AgentConfig, AutonomyLevel, Decision, EverydayAgent, Memory, Task

try:  # Optional dependency: the dependency-free demo must keep working.
    from strands import Agent as StrandsAgent
    from strands import tool as strands_tool

    STRANDS_AVAILABLE = True
except ImportError:  # pragma: no cover - normal path when the optional extra is absent.
    STRANDS_AVAILABLE = False
    StrandsAgent = None  # type: ignore[assignment]

    def strands_tool(function: Optional[Callable[..., Any]] = None, **_: Any) -> Any:
        """Fallback decorator preserving the callable tool contract locally."""
        if function is not None:
            return function

        def decorate(inner: Callable[..., Any]) -> Callable[..., Any]:
            return inner

        return decorate


class StrandsUnavailable(RuntimeError):
    """Raised when the Strands SDK is not installed."""


class ProviderUnavailable(RuntimeError):
    """Raised when the selected provider is not configured or reachable."""


class StrandsTraceRecorder:
    """Privacy-preserving callback state for one Strands invocation.

    Only lifecycle labels and tool names are retained. Tool arguments, model
    text, documents and response contents are deliberately never copied into
    the trace, so the UI can show evidence of orchestration without becoming a
    second sensitive-data log.
    """

    def __init__(self) -> None:
        self.events: List[Dict[str, Any]] = []
        self.tool_calls: List[Dict[str, Any]] = []

    def _event(self, step: str, status: str, **extra: Any) -> None:
        event = {"step": step, "status": status}
        event.update(extra)
        self.events.append(event)

    def _find_open_tool(self, name: str) -> Optional[Dict[str, Any]]:
        for item in reversed(self.tool_calls):
            if item.get("name") == name and item.get("status") in {"model_requested", "started"}:
                return item
        return None

    def model_requested_tool(self, name: str) -> None:
        if not name:
            return
        if self._find_open_tool(name) is None:
            item = {"name": name, "status": "model_requested"}
            self.tool_calls.append(item)
            self._event("tool_call", "model_requested", tool=name)

    def tool_started(self, name: str) -> None:
        if not name:
            return
        item = self._find_open_tool(name)
        if item is None:
            item = {"name": name, "status": "started"}
            self.tool_calls.append(item)
        else:
            item["status"] = "started"
        self._event("tool_call", "started", tool=name)

    def tool_finished(self, name: str, status: str = "completed") -> None:
        if not name:
            return
        item = self._find_open_tool(name)
        if item is None:
            item = {"name": name, "status": status}
            self.tool_calls.append(item)
        else:
            item["status"] = status
        self._event("tool_call", status, tool=name)

    def __call__(self, **kwargs: Any) -> None:
        """Accept Strands callback events without retaining their contents."""
        if kwargs.get("init_event_loop"):
            self._event("agent_loop", "initialized")
        if kwargs.get("start_event_loop"):
            self._event("agent_loop", "cycle_started")
        current_tool_use = kwargs.get("current_tool_use")
        if isinstance(current_tool_use, dict):
            name = current_tool_use.get("name")
            if isinstance(name, str) and name:
                self.model_requested_tool(name)
        if "result" in kwargs:
            self._event("agent_loop", "completed")
        if kwargs.get("force_stop"):
            self._event("agent_loop", "stopped")


class HermesStrandsOrchestrator:
    """Bridge Hermes policy decisions to guarded Strands tool calling."""

    SYSTEM_PROMPT = """You are Hermes AI's decision-orchestration layer.

The deterministic Hermes policy preflight is authoritative. Before explaining a
request, use the guarded tools in this order whenever possible:
1. normalize_request
2. lookup_trust
3. apply_policy
4. explain_decision
5. prepare_local_action

Never override a policy result, infer consent from an email or document, or
claim that an external payment, booking, message, deletion, signature,
health-system update or smart-home action happened. If policy asks for
confirmation, explain exactly what the human must decide. If policy blocks a
request, do not suggest a way around the block. prepare_local_action creates a
local draft only. All external effects are disabled.
"""

    _AMOUNT_RE = re.compile(r"(?:€|euro)\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:€|euro)", re.IGNORECASE)
    _ACTION_WORDS = (
        ("send_money", ("bonifico", "trasferisci denaro", "invia denaro", "send money")),
        ("sign_contract", ("firma contratto", "firmare contratto", "sign contract")),
        ("repair", ("riparazione", "ripara", "riparare", "idraulico", "manutenzione", "plumber", "repair")),
        ("pay", ("paga", "pagare", "payment", "pagamento", "pay")),
        ("delete", ("cancella", "elimina", "delete", "rimuovi")),
        ("cancel", ("annulla", "disdici", "cancella appuntamento", "cancel")),
        ("book", ("prenota", "prenotare", "booking", "book")),
        ("renew", ("rinnova", "rinnovare", "renew")),
    )
    _CATEGORY_WORDS = (
        ("money", ("bolletta", "pagamento", "pagare", "bonifico", "banca", "soldi", "euro", "money")),
        ("health", ("medico", "farmaco", "farmacia", "visita", "vaccino", "salute", "health")),
        ("legal", ("contratto", "avvocato", "legale", "testamento", "legal")),
        ("family", ("figlio", "figlia", "famiglia", "partner", "family")),
        ("home", ("casa", "idraulico", "caldaia", "rubinetto", "home")),
        ("errands", ("spesa", "commissione", "supermercato", "errand")),
    )

    def __init__(self, agent: Optional[EverydayAgent] = None):
        self.agent = agent or EverydayAgent(AgentConfig(), Memory())

    @staticmethod
    def _text(value: Any) -> str:
        return " ".join(str(value or "").strip().split())

    @classmethod
    def normalize_task(cls, request: Union[str, Dict[str, Any], Task]) -> Task:
        """Convert natural language or JSON into a bounded Task."""
        if isinstance(request, Task):
            return request
        if isinstance(request, dict):
            data = dict(request)
            if "title" not in data:
                data["title"] = data.get("request") or data.get("message") or "Richiesta senza titolo"
            return Task.from_dict(data)

        title = cls._text(request)
        if not title:
            raise ValueError("La richiesta non può essere vuota")
        lowered = title.casefold()
        action = "monitor"
        for candidate, words in cls._ACTION_WORDS:
            if any(word in lowered for word in words):
                action = candidate
                break
        category = "general"
        if action == "repair":
            category = "home"
        elif action in {"pay", "send_money"}:
            category = "money"
        else:
            for candidate, words in cls._CATEGORY_WORDS:
                if any(word in lowered for word in words):
                    category = candidate
                    break
        amount_match = cls._AMOUNT_RE.search(lowered)
        amount = None
        if amount_match:
            raw_amount = amount_match.group(1) or amount_match.group(2)
            amount = float(raw_amount.replace(",", "."))
        irreversible = action in {"send_money", "delete", "cancel", "sign_contract"}
        suspicious = any(term in lowered for term in ("truffa", "frode", "phishing", "sospetto", "scam", "fraud"))
        counterparty = cls._extract_counterparty(title)
        context = "family" if category == "family" else category
        return Task(
            title=title[:300],
            category=category,
            action=action,
            action_type=action,
            amount_eur=amount,
            reversible=not irreversible,
            suspicious=suspicious,
            context=context,
            counterparty=counterparty,
            provider=counterparty if counterparty != "unknown" else None,
        )

    @staticmethod
    def _extract_counterparty(title: str) -> str:
        lowered = title.casefold()
        known = ("enel", "eni", "hera", "vodafone", "tim", "amazon", "conad", "coop")
        for provider in known:
            if provider in lowered:
                return provider
        match = re.search(
            r"\b(?:con|da|di|del|della|per)\s+(?:un|uno|una|il|la|i|le)?\s*([a-zà-ú][a-zà-ú0-9_-]{2,24})",
            lowered,
        )
        return match.group(1) if match else "unknown"

    @staticmethod
    def _task_payload(task: Task) -> Dict[str, Any]:
        return asdict(task)

    @staticmethod
    def _decision_payload(decision: Decision) -> Dict[str, Any]:
        return {
            "level": int(decision.level),
            "levelName": decision.level.name,
            "reason": decision.reason,
            "explanation": decision.explanation,
            "trustScore": decision.trust_score,
            "trustKey": decision.trust_key,
            "trustContext": decision.trust_context,
            "trustCap": decision.trust_cap,
            "dynamicSpendLimitEur": decision.dynamic_spend_limit_eur,
            "trustSource": decision.trust_source,
            "importedTrustProposal": decision.imported_trust_proposal,
            "requiresHumanConfirmation": decision.level == AutonomyLevel.ASK_FIRST,
        }

    def plan(self, request: Union[str, Dict[str, Any], Task]) -> Dict[str, Any]:
        """Run the mandatory deterministic preflight; never contacts a model."""
        task = self.normalize_task(request)
        trust = self.agent.trust_engine.evaluate(task)
        decision = self.agent.classify(task)
        if decision.level == AutonomyLevel.ASK_FIRST:
            boundary_status = "confirmation_required"
        elif decision.level == AutonomyLevel.EXECUTE_AND_REPORT:
            boundary_status = "local_preparation_only"
        else:
            boundary_status = "local_action_only"
        return {
            "orchestrator": "hermes-strands-boundary",
            "version": 2,
            "mode": "deterministic-preflight",
            "externalAction": False,
            "task": self._task_payload(task),
            "trust": {
                "score": trust["score"],
                "effectiveScore": trust["effective_score"],
                "key": trust["key"],
                "source": trust["source"],
                "cap": trust["cap"],
                "dynamicSpendLimitEur": trust["dynamic_spend_limit_eur"],
            },
            "decision": self._decision_payload(decision),
            "trace": [
                {"step": "normalize_request", "status": "completed"},
                {"step": "lookup_exact_trust", "status": "completed", "key": trust["key"]},
                {"step": "apply_authoritative_policy", "status": "completed", "level": int(decision.level)},
                {"step": "human_control", "status": "required" if decision.level == AutonomyLevel.ASK_FIRST else "not_required_for_local_demo"},
                {"step": "external_side_effect_boundary", "status": boundary_status, "externalAction": False},
            ],
        }

    @staticmethod
    def _provider_name() -> str:
        return os.environ.get("HERMES_STRANDS_PROVIDER", "bedrock").strip().casefold() or "bedrock"

    @staticmethod
    def _cloud_opt_in() -> bool:
        return os.environ.get("HERMES_STRANDS_ALLOW_CLOUD", "").strip().casefold() in {"1", "true", "yes"}

    @staticmethod
    def _aws_credentials_hint() -> bool:
        """Detect a local/container credential configuration without reading secrets."""
        if any(os.environ.get(name) for name in (
            "AWS_BEARER_TOKEN_BEDROCK",
            "AWS_ACCESS_KEY_ID",
            "AWS_PROFILE",
            "AWS_CONTAINER_CREDENTIALS_RELATIVE_URI",
            "AWS_CONTAINER_CREDENTIALS_FULL_URI",
            "AWS_ROLE_ARN",
        )):
            return True
        aws_home = Path(os.environ.get("AWS_CONFIG_FILE", Path.home() / ".aws" / "config"))
        credentials = Path(os.environ.get("AWS_SHARED_CREDENTIALS_FILE", Path.home() / ".aws" / "credentials"))
        return aws_home.is_file() or credentials.is_file()

    @staticmethod
    def _ollama_host() -> str:
        return os.environ.get("HERMES_STRANDS_OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")

    @staticmethod
    def _ollama_model_id() -> str:
        return os.environ.get("HERMES_STRANDS_OLLAMA_MODEL", "llama3.1").strip() or "llama3.1"

    @staticmethod
    def _bedrock_model_id() -> str:
        return os.environ.get("HERMES_STRANDS_BEDROCK_MODEL", "global.anthropic.claude-sonnet-4-6").strip() or "global.anthropic.claude-sonnet-4-6"

    @staticmethod
    def _bedrock_region() -> str:
        return os.environ.get("AWS_DEFAULT_REGION", os.environ.get("AWS_REGION", "us-west-2"))

    @classmethod
    def _ollama_reachable(cls, host: str) -> bool:
        """Perform only a bounded read-only health probe for a loopback Ollama host."""
        parsed = urlparse(host)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            return False
        try:
            request = Request(f"{host}/api/tags", method="GET")
            with urlopen(request, timeout=0.8) as response:
                return 200 <= int(response.status) < 300
        except Exception:
            return False

    def provider_status(self) -> Dict[str, Any]:
        """Return a non-secret readiness state for the selected real provider."""
        provider = self._provider_name()
        base: Dict[str, Any] = {
            "provider": provider,
            "sdkInstalled": STRANDS_AVAILABLE,
            "ready": False,
            "state": "sdk-unavailable" if not STRANDS_AVAILABLE else "provider-unavailable",
            "externalActions": False,
            "cloudOptIn": self._cloud_opt_in(),
            "toolCatalog": self.tool_catalog(),
        }
        if not STRANDS_AVAILABLE:
            base["reason"] = "Installa strands-agents per abilitare l’invocazione reale."
            return base
        if provider not in {"bedrock", "ollama"}:
            base["state"] = "provider-unavailable"
            base["reason"] = "Provider non supportato: usa bedrock oppure ollama."
            return base
        if provider == "bedrock":
            base.update({"modelId": self._bedrock_model_id(), "region": self._bedrock_region(), "modelCredentialsPresent": self._aws_credentials_hint()})
            if not self._cloud_opt_in():
                base["reason"] = "Provider cloud disabilitato: imposta HERMES_STRANDS_ALLOW_CLOUD=true solo dopo aver approvato il trasferimento del prompt."
                return base
            if not base["modelCredentialsPresent"]:
                base["reason"] = "Credenziali AWS/Bedrock non rilevate; configura un profilo o un ruolo senza salvare segreti nel repository."
                return base
            try:
                from strands.models import BedrockModel  # noqa: F401
            except ImportError:
                base["reason"] = "Il provider Bedrock non è installato nell’ambiente Strands."
                return base
            base["ready"] = True
            base["state"] = "ready"
            base["reason"] = "Provider Bedrock configurato; l’accesso al modello sarà verificato all’invocazione."
            return base
        base.update({"modelId": self._ollama_model_id(), "host": self._ollama_host(), "modelCredentialsPresent": False})
        try:
            from strands.models.ollama import OllamaModel  # noqa: F401
        except ImportError:
            base["reason"] = "Installa strands-agents[ollama] per usare un modello locale Ollama."
            return base
        if not self._ollama_reachable(self._ollama_host()):
            base["reason"] = "Ollama non raggiungibile: avvia Ollama e assicurati che il modello sia disponibile."
            return base
        base["ready"] = True
        base["state"] = "ready"
        base["reason"] = "Provider Ollama locale raggiungibile; la prima invocazione verificherà il modello richiesto."
        return base

    def _tool_list(self, recorder: Optional[StrandsTraceRecorder] = None) -> List[Callable[..., Any]]:
        """Create state-bound tools; each call is read-only or a local draft."""
        def run_tool(name: str, operation: Callable[[], Dict[str, Any]]) -> Dict[str, Any]:
            if recorder:
                recorder.tool_started(name)
            try:
                result = operation()
            except Exception:
                if recorder:
                    recorder.tool_finished(name, "error")
                raise
            if recorder:
                recorder.tool_finished(name, "completed")
            return result

        @strands_tool
        def normalize_request(request: str) -> Dict[str, Any]:
            """Normalize a user request into action, domain, counterparty, amount and reversibility."""
            return run_tool("normalize_request", lambda: self._task_payload(self.normalize_task(request)))

        @strands_tool
        def lookup_trust(task: Dict[str, Any]) -> Dict[str, Any]:
            """Read the exact Dynamic Trust Engine profile for a normalized task."""
            def operation() -> Dict[str, Any]:
                normalized = self.normalize_task(task)
                result = self.agent.trust_engine.evaluate(normalized)
                return {"score": result["score"], "effectiveScore": result["effective_score"], "key": result["key"], "source": result["source"], "cap": result["cap"], "dynamicSpendLimitEur": result["dynamic_spend_limit_eur"]}
            return run_tool("lookup_trust", operation)

        @strands_tool
        def apply_policy(task: Dict[str, Any]) -> Dict[str, Any]:
            """Apply Hermes safety precedence; this tool cannot loosen a policy result."""
            return run_tool("apply_policy", lambda: self._decision_payload(self.agent.classify(self.normalize_task(task))))

        @strands_tool
        def explain_decision(task: Dict[str, Any]) -> Dict[str, Any]:
            """Return the human-readable rule and guardrails for a task."""
            def operation() -> Dict[str, Any]:
                normalized = self.normalize_task(task)
                decision = self.agent.classify(normalized)
                return {"explanation": decision.explanation or decision.reason, "reason": decision.reason, "trustScore": decision.trust_score, "trustKey": decision.trust_key, "humanConfirmation": decision.level == AutonomyLevel.ASK_FIRST}
            return run_tool("explain_decision", operation)

        @strands_tool
        def prepare_local_action(task: Dict[str, Any]) -> Dict[str, Any]:
            """Prepare a local draft only; never call a bank, vendor, email or health system."""
            def operation() -> Dict[str, Any]:
                normalized = self.normalize_task(task)
                decision = self.agent.classify(normalized)
                return {"status": "drafted" if decision.level != AutonomyLevel.ASK_FIRST else "waiting_for_confirmation", "externalAction": False, "reason": "Hermes AI has no active external connector in this prototype.", "requiresHumanConfirmation": decision.level == AutonomyLevel.ASK_FIRST}
            return run_tool("prepare_local_action", operation)

        return [normalize_request, lookup_trust, apply_policy, explain_decision, prepare_local_action]

    @staticmethod
    def _tool_name(tool: Any) -> str:
        for attribute in ("__name__", "name"):
            value = getattr(tool, attribute, None)
            if isinstance(value, str) and value:
                return value
        return "unnamed_tool"

    def tool_catalog(self) -> List[str]:
        return [self._tool_name(tool) for tool in self._tool_list()]

    def build_model(self) -> Any:
        """Build the selected real Strands provider after readiness checks."""
        status = self.provider_status()
        if not status["ready"]:
            raise ProviderUnavailable(str(status.get("reason", "Provider non pronto.")))
        if status["provider"] == "bedrock":
            from strands.models import BedrockModel
            return BedrockModel(model_id=self._bedrock_model_id(), region_name=self._bedrock_region(), temperature=0.2, max_tokens=700)
        from strands.models.ollama import OllamaModel
        return OllamaModel(host=self._ollama_host(), model_id=self._ollama_model_id(), temperature=0.2, keep_alive="10m")

    def build_agent(self, *, recorder: Optional[StrandsTraceRecorder] = None, model: Any = None) -> Any:
        """Build a real Strands Agent with the selected model and guarded tools."""
        if not STRANDS_AVAILABLE or StrandsAgent is None:
            raise StrandsUnavailable("Strands non è installato. Installa requirements-strands.txt.")
        selected_model = model if model is not None else self.build_model()
        return StrandsAgent(tools=self._tool_list(recorder), model=selected_model, system_prompt=self.SYSTEM_PROMPT, callback_handler=recorder)

    @staticmethod
    def _result_text(result: Any) -> str:
        if isinstance(result, str):
            return result
        message = getattr(result, "message", None)
        if isinstance(message, str):
            return message
        if isinstance(message, dict):
            content = message.get("content", [])
            parts = [item.get("text", "") for item in content if isinstance(item, dict) and item.get("text")]
            if parts:
                return "\n".join(parts)
        return str(result)

    def invoke(self, request: Union[str, Dict[str, Any], Task]) -> Dict[str, Any]:
        """Run a real model only when the SDK/provider are ready."""
        preflight = self.plan(request)
        status = self.provider_status()
        if not status["ready"]:
            return {
                "source": status["state"],
                "mode": status["state"],
                "response": preflight["decision"]["explanation"],
                "preflight": preflight,
                "externalAction": False,
                "provider": status.get("provider"),
                "providerStatus": status,
                "toolCalls": [],
                "fallbackReason": status.get("reason"),
            }
        recorder = StrandsTraceRecorder()
        try:
            strands_agent = self.build_agent(recorder=recorder)
            prompt = (
                "Use the guarded Hermes tools in the order described by the system prompt. "
                "Explain the safe next step and never claim an external action. Request:\n"
                + json.dumps(preflight["task"], ensure_ascii=False)
            )
            result = strands_agent(prompt)
        except Exception:
            # Never convert provider/model errors into a false success.
            return {
                "source": "provider-error",
                "mode": "provider-error",
                "response": preflight["decision"]["explanation"],
                "preflight": preflight,
                "externalAction": False,
                "provider": status.get("provider"),
                "providerStatus": status,
                "toolCalls": recorder.tool_calls,
                "agentTrace": recorder.events,
                "fallbackReason": "Il provider Strands non ha completato l’invocazione; nessuna azione esterna è stata eseguita.",
            }
        return {
            "source": "strands-agent",
            "mode": "strands-sdk",
            "response": self._result_text(result),
            "preflight": preflight,
            "externalAction": False,
            "provider": status.get("provider"),
            "providerStatus": status,
            "toolCalls": recorder.tool_calls,
            "agentTrace": recorder.events,
        }

    def status(self) -> Dict[str, Any]:
        """Public capability status with no secrets."""
        return self.provider_status()


def main() -> None:
    parser = argparse.ArgumentParser(description="Hermes AI real Strands orchestration boundary")
    parser.add_argument("request", nargs="?", help="Richiesta naturale da valutare o invocare")
    parser.add_argument("--invoke", action="store_true", help="Invoca il modello reale; richiede SDK e provider configurato")
    args = parser.parse_args()
    orchestrator = HermesStrandsOrchestrator()
    result = orchestrator.status() if args.request is None else (orchestrator.invoke(args.request) if args.invoke else orchestrator.plan(args.request))
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
