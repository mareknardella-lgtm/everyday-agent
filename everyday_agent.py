"""Everyday Agent: motore locale e senza dipendenze per la gestione della busywork.

Il modulo non esegue pagamenti, invii o cancellazioni: produce azioni proposte,
registra il contesto localmente e richiede conferma per le operazioni sensibili.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from copy import deepcopy
from dataclasses import asdict, dataclass, field, fields
from datetime import datetime, timedelta, timezone
from enum import IntEnum
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, List, Optional, Union


class AutonomyLevel(IntEnum):
    EXECUTE_SILENTLY = 1
    EXECUTE_AND_REPORT = 2
    ASK_FIRST = 3


SENSITIVE_CATEGORIES = {"money", "health", "legal", "contract", "family", "documents", "family_docs"}
IRREVERSIBLE_ACTIONS = {
    "cancel",
    "delete",
    "send_email",
    "send_message",
    "send_money",
    "sign_contract",
}
SUSPICIOUS_TERMS = ("frode", "sospett", "anomalo", "non riconosco", "truffa")
DEFAULT_DECISION_OPTIONS = ["Lasciare in sospeso", "Confermare dopo una verifica"]
AMBIGUOUS_TERMS = ("non so", "forse", "consigliami", "scegli tu", "decidi tu", "ambigua", "ambiguità")
HEALTH_ADVICE_TERMS = ("diagnosi", "diagnostic", "cura", "terapia", "farmaco", "dosaggio", "sintomo", "medico")
LEGAL_ADVICE_TERMS = ("consulenza legale", "parere legale", "avvocato", "diritto", "causa")
FINANCIAL_ADVICE_TERMS = ("investi", "investimento", "azioni", "finanza", "consulenza finanziaria", "mutuo")
DEFAULT_NEVER_DO = [
    "Non parlerò mai con il tuo medico, avvocato o consulente senza supervisione diretta.",
    "Non firmerò né accetterò mai un contratto legalmente vincolante in autonomia.",
    "Non modificherò mai un testamento o altri documenti legali.",
    "Non condividerò mai dati sanitari o finanziari senza il consenso esplicito del proprietario.",
    "Non supererò mai i tetti massimi di spesa, indipendentemente dalla fiducia.",
    "Non venderò né condividerò mai i tuoi dati per finalità commerciali.",
    "Non sostituirò mai una relazione umana né userò un framing affettivo.",
]
DEFAULT_SEASONAL_PERIODS = [
    {"name": "Dichiarazione dei redditi", "month": 5, "day": 31, "lead_days": 45},
    {"name": "Rientro a scuola", "month": 9, "day": 1, "lead_days": 30},
    {"name": "Rinnovi di fine anno", "month": 12, "day": 1, "lead_days": 45},
]

# Il punteggio è la regola generale. I livelli rimangono soltanto una
# compatibilità d'uscita per la UI e per i flussi già esistenti: non decidono
# più da soli cosa può fare l'agente.
TRUST_MIN_SCORE = 0.0
TRUST_MAX_SCORE = 100.0
TRUST_DEFAULT_SCORE = 20.0
TRUST_AUTO_EXECUTE_SCORE = 85.0
TRUST_REPORT_SCORE = 55.0
TRUST_DEFAULT_MAX_SPEND_EUR = 400.0
TRUST_DEFAULT_DECAY_HALF_LIFE_DAYS = 365.0
DEFAULT_TRUST_CAPS = {
    "money": 60.0,
    "health": 50.0,
    "legal": 45.0,
    "contract": 45.0,
    "documents": 45.0,
    "family_docs": 45.0,
}

# Guardrail di esecuzione: anche un futuro connettore reale deve passare da
# questi limiti e da un consenso per dominio. La demo li mantiene disattivati.
DEFAULT_MONEY_SINGLE_CAP_EUR = 100.0
DEFAULT_MONEY_MONTHLY_CAP_EUR = 300.0
DEFAULT_AUTONOMY_REVIEW_DAYS = 180
DEFAULT_AUDIT_RETENTION_DAYS = 365
BUSINESS_PLANS = {
    "base": {"label": "Base", "mode": "read_only", "description": "Sola lettura e riepiloghi."},
    "assisted": {"label": "Assistito", "mode": "human_in_the_loop", "description": "Azioni preparate con conferma umana."},
    "autonomous": {"label": "Autonomo", "mode": "scoped_autonomy", "description": "Azioni dirette solo dopo calibrazione, consenso e tetti."},
    "family": {"label": "Famiglia", "mode": "family_workspace", "description": "Permessi e contesto condivisi per nucleo familiare."},
}


@dataclass
class AgentConfig:
    spending_threshold_eur: float = 50.0
    digest_times: List[str] = field(default_factory=lambda: ["08:00", "19:00"])
    max_active_notifications_per_day: int = 3
    family_members: List[str] = field(default_factory=list)
    preferred_providers: Dict[str, str] = field(default_factory=dict)
    never_automate: List[str] = field(default_factory=list)
    notification_channel: str = "push"
    dnd_contexts: List[str] = field(default_factory=lambda: ["travel", "holiday", "family_weekend"])
    routing_rules: Dict[str, str] = field(default_factory=dict)
    emergency_delegate: Optional[str] = None
    calibration_days: int = 14
    calibration_extra_notifications: int = 2
    data_retention_days: int = 90
    legal_basis: str = "consent"
    third_party_sharing: bool = False
    seasonal_periods: List[Dict[str, Any]] = field(default_factory=lambda: deepcopy(DEFAULT_SEASONAL_PERIODS))
    family_permissions: Dict[str, Dict[str, List[str]]] = field(default_factory=lambda: {"owner": {"*": ["approve", "manage"]}})
    never_do: List[str] = field(default_factory=lambda: list(DEFAULT_NEVER_DO))
    trust_baseline_score: float = TRUST_DEFAULT_SCORE
    trust_auto_execute_score: float = TRUST_AUTO_EXECUTE_SCORE
    trust_report_score: float = TRUST_REPORT_SCORE
    trust_max_spend_eur: float = TRUST_DEFAULT_MAX_SPEND_EUR
    trust_decay_half_life_days: float = TRUST_DEFAULT_DECAY_HALF_LIFE_DAYS
    trust_import_discount: float = 0.35
    trust_sensitive_caps: Dict[str, float] = field(default_factory=lambda: dict(DEFAULT_TRUST_CAPS))
    # Policy del master document: nessuna autonomia monetaria reale nella demo.
    autonomous_money_enabled: bool = False
    money_single_transaction_cap_eur: float = DEFAULT_MONEY_SINGLE_CAP_EUR
    money_monthly_cap_eur: float = DEFAULT_MONEY_MONTHLY_CAP_EUR
    autonomy_consent_renewal_days: int = DEFAULT_AUTONOMY_REVIEW_DAYS
    audit_retention_days: int = DEFAULT_AUDIT_RETENTION_DAYS
    business_plan: str = "base"
    event_driven_monitoring: bool = True
    compute_cost_target_eur: float = 0.0
    dependency_review_days: int = DEFAULT_AUTONOMY_REVIEW_DAYS
    insurance_or_guarantee: Dict[str, Any] = field(default_factory=lambda: {
        "enabled": False,
        "provider": None,
        "coverage_eur": 0.0,
        "status": "da definire prima del deployment reale",
    })
    domain_consents: Dict[str, Dict[str, Any]] = field(default_factory=dict)

    @classmethod
    def from_file(cls, path: Path) -> "AgentConfig":
        if not path.exists():
            return cls()
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise ValueError("La configurazione deve essere un oggetto JSON")
        allowed = {item.name for item in fields(cls)}
        values = {key: value for key, value in data.items() if key in allowed}
        config = cls(**values)
        config.spending_threshold_eur = max(0.0, float(config.spending_threshold_eur))
        config.max_active_notifications_per_day = max(0, int(config.max_active_notifications_per_day))
        config.digest_times = list(config.digest_times or [])
        config.family_members = list(config.family_members or [])
        config.preferred_providers = dict(config.preferred_providers or {})
        config.never_automate = list(config.never_automate or [])
        config.dnd_contexts = list(config.dnd_contexts or [])
        config.routing_rules = dict(config.routing_rules or {})
        config.calibration_days = max(1, int(config.calibration_days))
        config.calibration_extra_notifications = max(0, int(config.calibration_extra_notifications))
        config.data_retention_days = max(1, int(config.data_retention_days))
        config.seasonal_periods = list(config.seasonal_periods if config.seasonal_periods is not None else DEFAULT_SEASONAL_PERIODS)
        config.family_permissions = dict(config.family_permissions or {})
        config.never_do = list(config.never_do or DEFAULT_NEVER_DO)
        config.seasonal_periods = [dict(item) for item in config.seasonal_periods if isinstance(item, dict)]
        config.trust_baseline_score = min(TRUST_MAX_SCORE, max(TRUST_MIN_SCORE, float(config.trust_baseline_score)))
        config.trust_auto_execute_score = min(TRUST_MAX_SCORE, max(config.trust_baseline_score, float(config.trust_auto_execute_score)))
        config.trust_report_score = min(config.trust_auto_execute_score, max(config.trust_baseline_score, float(config.trust_report_score)))
        config.trust_max_spend_eur = max(0.0, float(config.trust_max_spend_eur))
        config.trust_decay_half_life_days = max(1.0, float(config.trust_decay_half_life_days))
        config.trust_import_discount = min(1.0, max(0.0, float(config.trust_import_discount)))
        config.trust_sensitive_caps = {
            str(key).casefold(): min(TRUST_MAX_SCORE, max(TRUST_MIN_SCORE, float(value)))
            for key, value in dict(config.trust_sensitive_caps or DEFAULT_TRUST_CAPS).items()
        }
        config.autonomous_money_enabled = bool(config.autonomous_money_enabled)
        config.money_single_transaction_cap_eur = max(0.0, float(config.money_single_transaction_cap_eur))
        config.money_monthly_cap_eur = max(0.0, float(config.money_monthly_cap_eur))
        config.autonomy_consent_renewal_days = max(1, int(config.autonomy_consent_renewal_days))
        config.audit_retention_days = max(1, int(config.audit_retention_days))
        config.business_plan = str(config.business_plan or "base").casefold()
        if config.business_plan not in BUSINESS_PLANS:
            config.business_plan = "base"
        config.compute_cost_target_eur = max(0.0, float(config.compute_cost_target_eur))
        config.dependency_review_days = max(1, int(config.dependency_review_days))
        config.insurance_or_guarantee = dict(config.insurance_or_guarantee or {})
        config.domain_consents = dict(config.domain_consents or {})
        return config


@dataclass
class Task:
    title: str
    category: str = "general"
    action: str = "monitor"
    action_type: Optional[str] = None
    amount_eur: Optional[float] = None
    reversible: bool = True
    preapproved: bool = False
    urgent: bool = False
    suspicious: bool = False
    details: str = ""
    options: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    context: str = ""
    default_outcome: str = "Nessuna azione automatica: la richiesta resta in sospeso."
    recipient: Optional[str] = None
    permanent_authorization: bool = False
    affects_family: bool = False
    provider: Optional[str] = None
    counterparty: Optional[str] = None
    deadline: Optional[str] = None
    task_id: Optional[str] = None
    new_elements: str = ""

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Task":
        allowed = {item.name for item in fields(cls)}
        values = {key: value for key, value in data.items() if key in allowed}
        return cls(**values)


@dataclass
class Decision:
    task: Task
    level: AutonomyLevel
    reason: str
    options: List[str] = field(default_factory=list)
    active_notification: bool = False
    notification_queued: bool = False
    routed_to: Optional[str] = None
    calibration_notice: bool = False
    explanation: str = ""
    trust_score: float = TRUST_DEFAULT_SCORE
    trust_key: str = ""
    trust_context: str = ""
    trust_cap: Optional[float] = None
    dynamic_spend_limit_eur: float = 0.0
    trust_source: str = "observed"
    imported_trust_proposal: Optional[Dict[str, Any]] = None


class Memory:
    """Memoria JSON minima per preferenze, rifiuti, completamenti e pattern."""

    DEFAULT_DATA = {
        "preferences": {},
        "observed_patterns": [],
        "family_context": {},
        "rejections": [],
        "rejection_keys": [],
        "completed": [],
        "approved_counts": {},
        "automation_suggestions": [],
        "automation_rules": [],
        "silent_costs": [],
        "documents": [],
        "hidden_deadlines": [],
        "routing_rules": {},
        "security_events": [],
        "calibration_started_at": None,
        "calibration_acknowledged": False,
        "consents": {},
        "metrics": {
            "notifications_avoided": 0,
            "time_saved_minutes": 0,
            "level3_total": 0,
            "level3_deescalated": 0,
            "level3_approved": 0,
            "notifications_total": 0,
        },
        "undo_log": [],
        "integration_failures": [],
        "offboarding_events": [],
        "action_log": [],
        "offboarding": {},
        "trust_profiles": {},
        "trust_interactions": [],
        "trust_proposals": [],
        "audit_log": [],
        "audit_head": "",
        "domain_consents": {},
        "cold_start": {"phase": "import", "historical_imported": False, "imported_at": None, "source": None},
        "execution_errors": [],
        "crisis_events": [],
        "autonomy_reviews": [],
        "compute_events": [],
        "business_metrics": {
            "automations_never_disabled": 0,
            "automations_disabled": 0,
            "actions_executed": 0,
            "execution_errors": 0,
            "guarantee_cost_eur": 0.0,
            "revenue_eur": 0.0,
        },
        "event_queue": [],
        "money_spend": [],
        "manual_mode": False,
    }

    def __init__(
        self,
        path: Optional[Path] = None,
        *,
        initial_data: Optional[Dict[str, Any]] = None,
        save_callback: Optional[Callable[[Dict[str, Any]], None]] = None,
    ):
        """Crea memoria file-backed o collegata a un repository esterno.

        Il callback permette al backend di mantenere lo stesso contratto del
        motore senza far transitare lo stato dell'agente in file temporanei.
        Il callback riceve una copia profonda per evitare alias mutabili tra
        il motore e il livello di persistenza.
        """
        self.path = Path(path) if path is not None else None
        self._save_callback = save_callback
        self.data: Dict[str, Any] = deepcopy(self.DEFAULT_DATA)
        if initial_data is not None:
            loaded = deepcopy(initial_data)
            if not isinstance(loaded, dict):
                raise ValueError("La memoria iniziale deve essere un oggetto JSON")
            self.data.update(loaded)
        elif self.path is not None and self.path.exists():
            loaded = json.loads(self.path.read_text(encoding="utf-8"))
            if not isinstance(loaded, dict):
                raise ValueError("La memoria deve essere un oggetto JSON")
            self.data.update(loaded)
        self.data.setdefault("preferences", {})
        self.data.setdefault("observed_patterns", [])
        self.data.setdefault("family_context", {})
        self.data.setdefault("rejections", [])
        self.data.setdefault("rejection_keys", [])
        self.data.setdefault("completed", [])
        self.data.setdefault("approved_counts", {})
        self.data.setdefault("automation_suggestions", [])
        self.data.setdefault("automation_rules", [])
        self.data.setdefault("silent_costs", [])
        self.data.setdefault("documents", [])
        self.data.setdefault("hidden_deadlines", [])
        self.data.setdefault("routing_rules", {})
        self.data.setdefault("security_events", [])
        self.data.setdefault("calibration_started_at", None)
        self.data.setdefault("calibration_acknowledged", False)
        self.data.setdefault("consents", {})
        self.data.setdefault("metrics", deepcopy(self.DEFAULT_DATA["metrics"]))
        self.data["metrics"] = {**self.DEFAULT_DATA["metrics"], **dict(self.data["metrics"] or {})}
        self.data.setdefault("undo_log", [])
        self.data.setdefault("integration_failures", [])
        self.data.setdefault("offboarding_events", [])
        self.data.setdefault("action_log", [])
        self.data.setdefault("offboarding", {})
        self.data.setdefault("trust_profiles", {})
        self.data.setdefault("trust_interactions", [])
        self.data.setdefault("trust_proposals", [])
        self.data.setdefault("audit_log", [])
        self.data.setdefault("audit_head", "")
        self.data.setdefault("domain_consents", {})
        self.data.setdefault("cold_start", deepcopy(self.DEFAULT_DATA["cold_start"]))
        self.data["cold_start"] = {**self.DEFAULT_DATA["cold_start"], **dict(self.data["cold_start"] or {})}
        self.data.setdefault("execution_errors", [])
        self.data.setdefault("crisis_events", [])
        self.data.setdefault("autonomy_reviews", [])
        self.data.setdefault("compute_events", [])
        self.data.setdefault("business_metrics", deepcopy(self.DEFAULT_DATA["business_metrics"]))
        self.data["business_metrics"] = {**self.DEFAULT_DATA["business_metrics"], **dict(self.data["business_metrics"] or {})}
        self.data.setdefault("event_queue", [])
        self.data.setdefault("money_spend", [])
        self.data.setdefault("manual_mode", False)

    def save(self) -> None:
        if self._save_callback is not None:
            self._save_callback(deepcopy(self.data))
            return
        if self.path is None:
            return
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(self.data, ensure_ascii=False, indent=2), encoding="utf-8")

    def remember_preference(self, key: str, value: Any) -> None:
        self.data["preferences"][key] = value
        self.save()

    def remember_pattern(self, key: str, value: Any) -> None:
        patterns = self.data.setdefault("observed_patterns", [])
        patterns[:] = [item for item in patterns if not isinstance(item, dict) or item.get("key") != key]
        patterns.append({"key": key, "value": value, "observed_at": datetime.now(timezone.utc).isoformat()})
        self.save()

    def remember_family_member(self, name: str, role: str, recurring_deadlines: Optional[Iterable[str]] = None) -> None:
        self.data.setdefault("family_context", {})[name] = {
            "role": role,
            "recurring_deadlines": list(recurring_deadlines or []),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        self.save()

    def record_consent(self, purpose: str, granted: bool = True) -> None:
        self.data.setdefault("consents", {})[purpose] = {
            "granted": bool(granted),
            "at": datetime.now(timezone.utc).isoformat(),
        }
        self.save()

    def reject(self, task_title: str, trust_key: Optional[str] = None) -> None:
        changed = False
        if task_title not in self.data["rejections"]:
            self.data["rejections"].append(task_title)
            changed = True
        if trust_key and trust_key not in self.data.setdefault("rejection_keys", []):
            self.data["rejection_keys"].append(trust_key)
            changed = True
        if changed:
            self.save()

    def record_completion(self, task: Task) -> None:
        self.data["completed"].append(asdict(task))
        self.save()

    def record_silent_cost(self, item: Dict[str, Any]) -> None:
        self.data["silent_costs"].append(item)
        self.save()

    def record_document(self, document: Dict[str, Any]) -> None:
        self.data["documents"].append(document)
        self.save()

    def record_hidden_deadline(self, deadline: Dict[str, Any]) -> None:
        self.data["hidden_deadlines"].append(deadline)
        self.save()

    def record_security_event(self, event: Dict[str, Any]) -> None:
        self.data["security_events"].append(event)
        self.save()

    def start_calibration(self, started_at: Optional[str] = None) -> str:
        if not self.data.get("calibration_started_at"):
            self.data["calibration_started_at"] = started_at or datetime.now(timezone.utc).isoformat()
            self.save()
        return self.data["calibration_started_at"]

    def acknowledge_calibration(self) -> None:
        self.data["calibration_acknowledged"] = True
        self.save()

    def calibration_active(self, days: int = 14) -> bool:
        started_at = self.data.get("calibration_started_at")
        if not started_at:
            return False
        try:
            started = datetime.fromisoformat(started_at)
            if started.tzinfo is None:
                started = started.replace(tzinfo=timezone.utc)
            elapsed = datetime.now(timezone.utc) - started
            return elapsed.days < days
        except (TypeError, ValueError):
            return False

    def record_metric(self, key: str, amount: int = 1) -> None:
        metrics = self.data.setdefault("metrics", {})
        metrics[key] = int(metrics.get(key, 0)) + amount
        self.save()

    def record_undo(self, action: Dict[str, Any]) -> None:
        self.data["undo_log"].append(action)
        self.save()

    def record_integration_failure(self, failure: Dict[str, Any]) -> None:
        self.data["integration_failures"].append({**failure, "kind": "technical"})
        self.save()

    def record_offboarding(self, event: Dict[str, Any]) -> None:
        self.data["offboarding_events"].append(event)
        self.save()

    def record_action(self, action: Dict[str, Any]) -> None:
        self.data["action_log"].append(deepcopy(action))
        self.record_audit({"event": "action_recorded", "action": deepcopy(action)})

    def record_audit(self, event: Dict[str, Any], at: Optional[Union[str, datetime]] = None) -> Dict[str, Any]:
        """Aggiunge un evento a una catena hash append-only verificabile localmente.

        Non è una sostituzione di un audit log qualificato o di un WORM storage,
        ma rende evidenti le alterazioni accidentali della demo e separa il log
        probatorio dalla cronologia modificabile di undo.
        """
        timestamp = at.isoformat() if isinstance(at, datetime) else str(at or datetime.now(timezone.utc).isoformat())
        previous_hash = str(self.data.get("audit_head") or "")
        payload = {
            "sequence": len(self.data.get("audit_log", [])) + 1,
            "at": timestamp,
            "event": deepcopy(event),
            "previous_hash": previous_hash,
        }
        serialized = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        entry = {**payload, "hash": hashlib.sha256(serialized.encode("utf-8")).hexdigest()}
        self.data.setdefault("audit_log", []).append(entry)
        self.data["audit_head"] = entry["hash"]
        self.save()
        return deepcopy(entry)

    def verify_audit_log(self) -> Dict[str, Any]:
        """Verifica sequenza e hash della catena senza modificarla."""
        previous_hash = ""
        checked = 0
        for expected_sequence, entry in enumerate(self.data.get("audit_log", []), 1):
            if not isinstance(entry, dict):
                return {"valid": False, "checked": checked, "reason": "evento non valido"}
            payload = {key: entry.get(key) for key in ("sequence", "at", "event", "previous_hash")}
            serialized = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
            expected_hash = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
            if entry.get("sequence") != expected_sequence or entry.get("previous_hash", "") != previous_hash or entry.get("hash") != expected_hash:
                return {"valid": False, "checked": checked, "reason": f"catena non valida alla sequenza {expected_sequence}"}
            previous_hash = expected_hash
            checked += 1
        head = str(self.data.get("audit_head") or "")
        return {"valid": head == previous_hash, "checked": checked, "head": head}

    def record_domain_consent(self, domain: str, scope: str = "autonomy", actor: str = "owner", granted: bool = True, expires_at: Optional[str] = None) -> Dict[str, Any]:
        consent = {
            "domain": str(domain).casefold(),
            "scope": str(scope),
            "actor": str(actor),
            "granted": bool(granted),
            "granted_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": expires_at,
        }
        self.data.setdefault("domain_consents", {})[consent["domain"]] = consent
        self.save()
        return deepcopy(consent)

    def record_event(self, event: Dict[str, Any]) -> None:
        self.data.setdefault("event_queue", []).append(deepcopy(event))
        self.save()

    def record_compute_event(self, event: Dict[str, Any]) -> None:
        self.data.setdefault("compute_events", []).append(deepcopy(event))
        self.save()

    def purge_expired(self, retention_days: int, now: Optional[datetime] = None) -> int:
        """Rimuove gli eventi temporanei oltre il periodo di conservazione configurato."""
        current = now or datetime.now(timezone.utc)
        if current.tzinfo is None:
            current = current.replace(tzinfo=timezone.utc)
        cutoff = current - timedelta(days=max(1, int(retention_days)))
        removed = 0
        for key in ("completed", "silent_costs", "documents", "hidden_deadlines", "security_events", "integration_failures", "action_log", "undo_log", "offboarding_events", "trust_interactions", "trust_proposals"):
            kept = []
            for item in self.data.get(key, []):
                stamp = item.get("at") or item.get("archived_at") or item.get("created_at")
                try:
                    timestamp = datetime.fromisoformat(stamp) if stamp else None
                    if timestamp and timestamp.tzinfo is None:
                        timestamp = timestamp.replace(tzinfo=timezone.utc)
                except (TypeError, ValueError):
                    timestamp = None
                if timestamp and timestamp < cutoff:
                    removed += 1
                else:
                    kept.append(item)
            self.data[key] = kept
        if removed:
            self.save()
        return removed

    def erase_personal_data(self) -> None:
        self.data = deepcopy(self.DEFAULT_DATA)
        self.save()

    def record_approval(self, task_title: str, suggestion_after: int = 3) -> bool:
        counts = self.data["approved_counts"]
        counts[task_title] = int(counts.get(task_title, 0)) + 1
        should_suggest = counts[task_title] >= suggestion_after and task_title not in self.data["automation_suggestions"]
        if should_suggest:
            self.data["automation_suggestions"].append(task_title)
        self.save()
        return should_suggest


class DynamicTrustEngine:
    """Calcola fiducia continua per la tripla azione/controparte/contesto.

    Il motore è intenzionalmente prudente: una combinazione mai osservata parte
    da 20/100, la fiducia importata da combinazioni simili è scontata e non può
    mai attivare il Livello 1, mentre il decadimento dimezza dopo dodici mesi la
    distanza del profilo dal valore iniziale.
    """

    ACTION_GROUPS = {
        "book": "booking",
        "booking": "booking",
        "reserve": "booking",
        "choose_quote": "procurement",
        "quote": "procurement",
        "repair": "home_service",
        "maintenance": "home_service",
        "renew": "renewal",
        "renewal": "renewal",
        "pay": "payment",
        "payment": "payment",
        "monitor": "monitoring",
    }

    def __init__(self, config: AgentConfig, memory: Memory):
        self.config = config
        self.memory = memory
        self.memory.data.setdefault("trust_profiles", {})
        self.memory.data.setdefault("trust_interactions", [])
        self.memory.data.setdefault("trust_proposals", [])

    @staticmethod
    def _normalize(value: Any, fallback: str) -> str:
        normalized = " ".join(str(value or "").strip().casefold().split())
        return normalized or fallback

    @staticmethod
    def _parse_datetime(value: Any, fallback: Optional[datetime] = None) -> Optional[datetime]:
        if isinstance(value, datetime):
            parsed = value
        elif value:
            try:
                parsed = datetime.fromisoformat(str(value))
            except (TypeError, ValueError):
                return fallback
        else:
            return fallback
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.astimezone(timezone.utc)

    def key(self, action_type: str, counterparty: Optional[str] = None, context: Optional[str] = None) -> str:
        return "|".join((
            self._normalize(action_type, "monitor"),
            self._normalize(counterparty, "unknown"),
            self._normalize(context, "default"),
        ))

    def _parts(self, key: str) -> Dict[str, str]:
        action, counterparty, context = (list(key.split("|", 2)) + ["", ""])[:3]
        return {"action_type": action, "counterparty": counterparty, "context": context}

    def _decay(self, score: float, last_interaction_at: Any, now: Optional[datetime] = None) -> float:
        current = now or datetime.now(timezone.utc)
        if current.tzinfo is None:
            current = current.replace(tzinfo=timezone.utc)
        last = self._parse_datetime(last_interaction_at)
        if not last:
            return min(TRUST_MAX_SCORE, max(TRUST_MIN_SCORE, float(score)))
        elapsed_days = max(0.0, (current - last).total_seconds() / 86400)
        half_life = max(1.0, float(self.config.trust_decay_half_life_days))
        factor = 0.5 ** (elapsed_days / half_life)
        baseline = float(self.config.trust_baseline_score)
        decayed = baseline + (float(score) - baseline) * factor
        return min(TRUST_MAX_SCORE, max(TRUST_MIN_SCORE, decayed))

    def _action_group(self, action_type: str) -> str:
        normalized = self._normalize(action_type, "monitor")
        return self.ACTION_GROUPS.get(normalized, normalized)

    def _profile_from_record(self, key: str, record: Dict[str, Any], now: Optional[datetime] = None) -> Dict[str, Any]:
        parts = self._parts(key)
        score = self._decay(record.get("score", self.config.trust_baseline_score), record.get("last_interaction_at"), now)
        return {
            **parts,
            "key": key,
            "score": round(score, 2),
            "raw_score": round(float(record.get("score", self.config.trust_baseline_score)), 2),
            "interactions": int(record.get("interactions", 0) or 0),
            "approvals": int(record.get("approvals", 0) or 0),
            "rejections": int(record.get("rejections", 0) or 0),
            "errors": int(record.get("errors", 0) or 0),
            "last_interaction_at": record.get("last_interaction_at"),
            "last_response_time_seconds": record.get("last_response_time_seconds"),
            "source": record.get("source", "observed"),
            "decay_applied": round(float(record.get("score", self.config.trust_baseline_score)) - score, 2),
        }

    def _import_similar(self, action_type: str, counterparty: str, context: str, now: Optional[datetime] = None) -> Optional[Dict[str, Any]]:
        target_group = self._action_group(action_type)
        candidates = []
        exact_key = self.key(action_type, counterparty, context)
        for key, record in self.memory.data.get("trust_profiles", {}).items():
            if key == exact_key or not isinstance(record, dict):
                continue
            parts = self._parts(key)
            if self._action_group(parts["action_type"]) != target_group:
                continue
            profile = self._profile_from_record(key, record, now)
            if profile["score"] > float(self.config.trust_baseline_score):
                candidates.append(profile)
        if not candidates:
            return None
        candidates.sort(key=lambda item: (item["score"], item["interactions"]), reverse=True)
        source = candidates[0]
        baseline = float(self.config.trust_baseline_score)
        discount = float(self.config.trust_import_discount)
        imported_score = baseline + (source["score"] - baseline) * discount
        proposal = {
            "key": exact_key,
            "action_type": self._normalize(action_type, "monitor"),
            "counterparty": self._normalize(counterparty, "unknown"),
            "context": self._normalize(context, "default"),
            "score": round(imported_score, 2),
            "source_key": source["key"],
            "source_score": source["score"],
            "discount": discount,
            "requires_explicit_confirmation": True,
            "never_level_one": True,
            "reason": "fiducia importata da una combinazione simile, con sconto prudenziale",
        }
        return proposal

    def profile(self, action_type: str, counterparty: Optional[str] = None, context: Optional[str] = None, now: Optional[datetime] = None) -> Dict[str, Any]:
        normalized_action = self._normalize(action_type, "monitor")
        normalized_counterparty = self._normalize(counterparty, "unknown")
        normalized_context = self._normalize(context, "default")
        key = self.key(normalized_action, normalized_counterparty, normalized_context)
        record = self.memory.data.get("trust_profiles", {}).get(key)
        if isinstance(record, dict):
            return self._profile_from_record(key, record, now)
        imported = self._import_similar(normalized_action, normalized_counterparty, normalized_context, now)
        if imported:
            return {
                **imported,
                "raw_score": imported["score"],
                "interactions": 0,
                "approvals": 0,
                "rejections": 0,
                "errors": 0,
                "last_interaction_at": None,
                "last_response_time_seconds": None,
                "source": "imported",
                "decay_applied": 0.0,
            }
        return {
            "action_type": normalized_action,
            "counterparty": normalized_counterparty,
            "context": normalized_context,
            "key": key,
            "score": round(float(self.config.trust_baseline_score), 2),
            "raw_score": round(float(self.config.trust_baseline_score), 2),
            "interactions": 0,
            "approvals": 0,
            "rejections": 0,
            "errors": 0,
            "last_interaction_at": None,
            "last_response_time_seconds": None,
            "source": "new",
            "decay_applied": 0.0,
        }

    def evaluate(self, task: Task, now: Optional[datetime] = None) -> Dict[str, Any]:
        action_type = task.action_type or task.action or "monitor"
        counterparty = task.counterparty or task.provider or "unknown"
        context = task.context or task.category or "general"
        profile = self.profile(action_type, counterparty, context, now)
        category = str(task.category or "general").casefold()
        cap = self.config.trust_sensitive_caps.get(category)
        effective_score = min(profile["score"], float(cap)) if cap is not None else profile["score"]
        baseline = float(self.config.trust_baseline_score)
        auto_threshold = float(self.config.trust_auto_execute_score)
        max_spend = 0.0
        if cap is None:
            if effective_score >= auto_threshold:
                max_spend = float(self.config.trust_max_spend_eur)
            elif effective_score > baseline and auto_threshold > baseline:
                max_spend = float(self.config.trust_max_spend_eur) * (effective_score - baseline) / (auto_threshold - baseline)
        return {
            "profile": profile,
            "score": round(profile["score"], 2),
            "effective_score": round(effective_score, 2),
            "key": profile["key"],
            "action_type": profile["action_type"],
            "counterparty": profile["counterparty"],
            "context": profile["context"],
            "cap": cap,
            "dynamic_spend_limit_eur": round(max_spend, 2),
            "source": profile.get("source", "new"),
            "imported_proposal": profile if profile.get("source") == "imported" else None,
            "has_specific_counterparty": profile["counterparty"] != "unknown",
        }

    def update(
        self,
        action_type: str,
        counterparty: Optional[str] = None,
        context: Optional[str] = None,
        outcome: str = "approved",
        response_time_seconds: Optional[float] = None,
        at: Optional[Union[str, datetime]] = None,
        latency_seconds: Optional[float] = None,
    ) -> Dict[str, Any]:
        timestamp = self._parse_datetime(at, datetime.now(timezone.utc)) or datetime.now(timezone.utc)
        if response_time_seconds is None:
            response_time_seconds = latency_seconds
        key = self.key(action_type, counterparty, context)
        profiles = self.memory.data.setdefault("trust_profiles", {})
        previous = profiles.get(key) if isinstance(profiles.get(key), dict) else None
        current = self.profile(action_type, counterparty, context, now=timestamp)
        before = float(current["score"])
        normalized_outcome = str(outcome).casefold()
        latency = None if response_time_seconds is None else max(0.0, float(response_time_seconds))
        if normalized_outcome in {"rejected", "reject", "no", "denied"}:
            delta = -30.0
            counter = "rejections"
        elif normalized_outcome in {"error", "failed", "failure", "incident"}:
            # Un errore riduce la fiducia della sola combinazione coinvolta.
            delta = -40.0
            counter = "errors"
        elif normalized_outcome in {"approved", "approve", "yes", "accepted"}:
            if latency is None:
                delta = 4.0
            elif latency <= 3600:
                delta = 12.0
            elif latency <= 86400:
                delta = 6.0
            elif latency <= 172800:
                delta = 1.0
            else:
                delta = 0.0
            counter = "approvals"
        elif normalized_outcome in {"deferred", "defer", "hesitated"}:
            delta = -2.0
            counter = None
        else:
            delta = 0.0
            counter = None
        after = min(TRUST_MAX_SCORE, max(TRUST_MIN_SCORE, before + delta))
        record = {
            **(previous or {}),
            "score": round(after, 2),
            "interactions": int((previous or {}).get("interactions", 0) or 0) + 1,
            "approvals": int((previous or {}).get("approvals", 0) or 0) + (1 if counter == "approvals" else 0),
            "rejections": int((previous or {}).get("rejections", 0) or 0) + (1 if counter == "rejections" else 0),
            "errors": int((previous or {}).get("errors", 0) or 0) + (1 if counter == "errors" else 0),
            "last_interaction_at": timestamp.isoformat(),
            "last_response_time_seconds": latency,
            "source": "observed",
        }
        profiles[key] = record
        interaction = {
            "key": key,
            "action_type": self._normalize(action_type, "monitor"),
            "counterparty": self._normalize(counterparty, "unknown"),
            "context": self._normalize(context, "default"),
            "outcome": normalized_outcome,
            "response_time_seconds": latency,
            "score_before": round(before, 2),
            "delta": round(delta, 2),
            "score_after": round(after, 2),
            "at": timestamp.isoformat(),
        }
        self.memory.data.setdefault("trust_interactions", []).append(interaction)
        self.memory.save()
        return {**interaction, "profile": self._profile_from_record(key, record, timestamp)}

    def update_task(
        self,
        task: Task,
        outcome: str = "approved",
        response_time_seconds: Optional[float] = None,
        at: Optional[Union[str, datetime]] = None,
        latency_seconds: Optional[float] = None,
    ) -> Dict[str, Any]:
        return self.update(task.action_type or task.action, task.counterparty or task.provider, task.context or task.category, outcome, response_time_seconds, at, latency_seconds)

    def get_score(self, action_type: str, counterparty: Optional[str] = None, context: Optional[str] = None) -> float:
        return float(self.profile(action_type, counterparty, context)["score"])

    def update_interaction(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
        return self.update(*args, **kwargs)

    def set_score(self, action_type: str, counterparty: str, context: str, score: float, source: str = "explicit") -> Dict[str, Any]:
        key = self.key(action_type, counterparty, context)
        bounded = min(TRUST_MAX_SCORE, max(TRUST_MIN_SCORE, float(score)))
        now = datetime.now(timezone.utc).isoformat()
        self.memory.data.setdefault("trust_profiles", {})[key] = {
            "score": round(bounded, 2),
            "interactions": 0,
            "approvals": 0,
            "rejections": 0,
            "last_interaction_at": now,
            "last_response_time_seconds": None,
            "source": source,
        }
        self.memory.save()
        return self.profile(action_type, counterparty, context)

    def profiles(self, now: Optional[datetime] = None) -> List[Dict[str, Any]]:
        return sorted(
            [self._profile_from_record(key, record, now) for key, record in self.memory.data.get("trust_profiles", {}).items() if isinstance(record, dict)],
            key=lambda item: item["score"],
            reverse=True,
        )


class EverydayAgent:
    def __init__(self, config: AgentConfig, memory: Memory):
        self.config = config
        self.memory = memory
        self.pending: List[Decision] = []
        self.completed_today: List[Task] = []
        self.queued_notifications: List[Decision] = []
        self.notifications_today = 0
        self.notification_date = self._today()
        self.last_automation_suggestion: Optional[str] = None
        self.action_history: List[Dict[str, Any]] = list(self.memory.data.get("action_log", []))
        self.paused = bool(self.memory.data.get("offboarding", {}).get("paused", False))
        self.manual_mode = bool(self.memory.data.get("manual_mode", False))
        configured_consents = config.domain_consents or {}
        stored_consents = self.memory.data.setdefault("domain_consents", {})
        for domain, consent in configured_consents.items():
            if isinstance(consent, dict) and str(domain).casefold() not in stored_consents:
                stored_consents[str(domain).casefold()] = deepcopy(consent)
        if configured_consents:
            self.memory.save()
        self.trust_engine = DynamicTrustEngine(config, memory)
        # Alias breve per chi integra il motore senza dipendere dal nome interno.
        self.trust = self.trust_engine
        self.memory.start_calibration()

    @staticmethod
    def _today() -> str:
        return datetime.now(timezone.utc).date().isoformat()

    def _reset_daily_notifications(self) -> None:
        today = self._today()
        if today != self.notification_date:
            self.notification_date = today
            self.notifications_today = 0
            self.queued_notifications.clear()

    @staticmethod
    def _matches_rule(task: Task, rules: Iterable[str]) -> bool:
        haystack = " ".join((task.title, task.category, task.action_type or task.action)).casefold()
        return any(str(rule).strip().casefold() in haystack for rule in rules if str(rule).strip())

    @staticmethod
    def _is_suspicious(task: Task) -> bool:
        text = f"{task.title} {task.details}".casefold()
        return task.suspicious or any(term in text for term in SUSPICIOUS_TERMS)

    def _decision(self, task: Task, reason: str, trust: Optional[Dict[str, Any]] = None) -> Decision:
        trust = trust or self.trust_engine.evaluate(task)
        explanation = reason
        if trust.get("source") == "imported":
            explanation += "; la fiducia simile è stata importata con cautela e non abilita l'esecuzione silenziosa"
        return Decision(
            task=task,
            level=AutonomyLevel.ASK_FIRST,
            reason=reason,
            options=list(task.options or DEFAULT_DECISION_OPTIONS),
            routed_to=task.recipient or self.config.routing_rules.get(task.category),
            explanation=explanation,
            trust_score=trust["score"],
            trust_key=trust["key"],
            trust_context=trust["context"],
            trust_cap=trust.get("cap"),
            dynamic_spend_limit_eur=trust["dynamic_spend_limit_eur"],
            trust_source=trust.get("source", "new"),
            imported_trust_proposal=trust.get("imported_proposal"),
        )

    def _report(self, task: Task, reason: str, trust: Optional[Dict[str, Any]] = None) -> Decision:
        trust = trust or self.trust_engine.evaluate(task)
        return Decision(
            task=task,
            level=AutonomyLevel.EXECUTE_AND_REPORT,
            reason=reason,
            explanation=reason,
            trust_score=trust["score"],
            trust_key=trust["key"],
            trust_context=trust["context"],
            trust_cap=trust.get("cap"),
            dynamic_spend_limit_eur=trust["dynamic_spend_limit_eur"],
            trust_source=trust.get("source", "new"),
            imported_trust_proposal=trust.get("imported_proposal"),
        )

    def _silent(self, task: Task, reason: str, trust: Optional[Dict[str, Any]] = None) -> Decision:
        trust = trust or self.trust_engine.evaluate(task)
        return Decision(
            task=task,
            level=AutonomyLevel.EXECUTE_SILENTLY,
            reason=reason,
            explanation=reason,
            trust_score=trust["score"],
            trust_key=trust["key"],
            trust_context=trust["context"],
            trust_cap=trust.get("cap"),
            dynamic_spend_limit_eur=trust["dynamic_spend_limit_eur"],
            trust_source=trust.get("source", "new"),
            imported_trust_proposal=trust.get("imported_proposal"),
        )

    def calibration_status(self) -> Dict[str, Any]:
        started_at = self.memory.data.get("calibration_started_at")
        active = self.calibration_active()
        remaining = 0
        if started_at:
            try:
                started = datetime.fromisoformat(started_at)
                if started.tzinfo is None:
                    started = started.replace(tzinfo=timezone.utc)
                elapsed = datetime.now(timezone.utc) - started
                remaining = max(0, self.config.calibration_days - elapsed.days)
            except (TypeError, ValueError):
                remaining = 0
        return {
            "active": active,
            "started_at": started_at,
            "days": self.config.calibration_days,
            "days_remaining": remaining if active else 0,
            "notice": (
                f"Sto ancora calibrando la fiducia per singola combinazione: per i primi {self.config.calibration_days} giorni potresti ricevere qualche notifica in più."
                if active else "Calibrazione completata: applico la fiducia appresa caso per caso."
            ),
        }

    def calibration_active(self) -> bool:
        return self.memory.calibration_active(self.config.calibration_days)

    def effective_notification_limit(self) -> int:
        # La calibrazione aumenta i dettagli e le notifiche passive, ma non può
        # bypassare il limite attivo scelto dall'utente. Le emergenze restano
        # comunque gestite da _assign_notification().
        return self.config.max_active_notifications_per_day

    def can_approve(self, member: str, category: str, action: str = "approve") -> bool:
        """Verifica la matrice dei permessi prima di accettare una decisione."""
        role = str(member or "").strip().casefold()
        domain = str(category or "general").strip().casefold()
        permissions = self.config.family_permissions or {}
        if not permissions:
            return role == "owner"
        member_permissions = permissions.get(role) or permissions.get(member) or {}
        if not isinstance(member_permissions, dict):
            return False
        raw = list(member_permissions.get(domain, []) or []) + list(member_permissions.get("*", []) or [])
        if isinstance(member_permissions.get(domain), str):
            raw = [member_permissions[domain]] + list(member_permissions.get("*", []) or [])
        normalized = {str(item).casefold() for item in raw}
        return action.casefold() in normalized or "manage" in normalized or "all" in normalized

    def permission_matrix(self) -> Dict[str, Dict[str, List[str]]]:
        return deepcopy(self.config.family_permissions or {})

    def set_family_permission(self, member: str, category: str, permissions: Iterable[str]) -> None:
        matrix = self.config.family_permissions.setdefault(member.casefold(), {})
        matrix[category.casefold()] = [str(item) for item in permissions]
        self.memory.record_audit({"event": "family_permission_changed", "member": member.casefold(), "category": category.casefold(), "permissions": list(matrix[category.casefold()])})
        self.memory.save()

    def explain(self, task: Union[Task, str]) -> str:
        title = task.title if isinstance(task, Task) else str(task)
        previous = next((item for item in reversed(self.action_history) if item.get("task", {}).get("title", "").casefold() == title.casefold()), None)
        if previous:
            reversible = previous.get("task", {}).get("reversible", True)
            rollback = "L'annullamento locale è disponibile." if reversible else "Questa azione non è reversibile: serve contattare il fornitore."
            return f"Livello {previous.get('level')}: {previous.get('reason')}. Regola applicata: {previous.get('reason')}. {rollback}"
        current_task = task if isinstance(task, Task) else Task(title)
        decision = self.classify(current_task)
        if decision.level == AutonomyLevel.EXECUTE_SILENTLY:
            return f"Livello 1 perché: {decision.reason}. Regola applicata: attività reversibile già autorizzata; nessuna azione esterna viene eseguita dalla demo."
        return f"Livello {decision.level}: {decision.reason}."

    def simulate_no_response(self, task: Task) -> str:
        """Espone l'esito predefinito senza inventare un'azione esterna."""
        return f"Se non rispondi: {task.default_outcome}"

    def complete_onboarding(self) -> Dict[str, Any]:
        self.memory.acknowledge_calibration()
        return self.calibration_status()

    def grant_domain_consent(
        self,
        domain: str,
        scope: str = "autonomy",
        actor: str = "owner",
        expires_at: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Concede un consenso specifico e rinnovabile per un solo dominio.

        Un consenso generale non viene mai riutilizzato per salute, denaro o
        documenti: il chiamante deve indicare esplicitamente il dominio.
        """
        now = datetime.now(timezone.utc)
        if expires_at is None:
            expires_at = (now + timedelta(days=self.config.autonomy_consent_renewal_days)).isoformat()
        consent = self.memory.record_domain_consent(domain, scope, actor, True, expires_at)
        self.memory.record_audit({"event": "domain_consent_granted", "domain": str(domain).casefold(), "scope": scope, "actor": actor, "expires_at": expires_at})
        return consent

    def revoke_domain_consent(self, domain: str, actor: str = "owner") -> Dict[str, Any]:
        """Revoca immediatamente il consenso del solo dominio indicato."""
        consent = self.memory.record_domain_consent(domain, "revoked", actor, False, None)
        self.memory.record_audit({"event": "domain_consent_revoked", "domain": str(domain).casefold(), "actor": actor})
        return consent

    def domain_consent_status(self, domain: str, now: Optional[datetime] = None) -> Dict[str, Any]:
        normalized = str(domain or "general").casefold()
        consent = deepcopy(self.memory.data.get("domain_consents", {}).get(normalized, {}))
        current = now or datetime.now(timezone.utc)
        if current.tzinfo is None:
            current = current.replace(tzinfo=timezone.utc)
        expires = self.trust_engine._parse_datetime(consent.get("expires_at"))
        valid = bool(consent.get("granted")) and (expires is None or expires > current)
        return {"domain": normalized, "granted": bool(consent.get("granted")), "valid": valid, "scope": consent.get("scope"), "actor": consent.get("actor"), "granted_at": consent.get("granted_at"), "expires_at": consent.get("expires_at"), "renewal_required": bool(consent.get("granted")) and expires is not None and expires <= current}

    def has_domain_consent(self, domain: str, scope: str = "autonomy", now: Optional[datetime] = None) -> bool:
        status = self.domain_consent_status(domain, now)
        return bool(status["valid"] and (not scope or status.get("scope") == scope or status.get("scope") == "manage"))

    def autonomy_review_status(self, now: Optional[datetime] = None) -> Dict[str, Any]:
        """Indica quando è necessario ricontrollare l'autonomia concessa."""
        current = now or datetime.now(timezone.utc)
        if current.tzinfo is None:
            current = current.replace(tzinfo=timezone.utc)
        latest: Dict[str, Dict[str, Any]] = {}
        for review in self.memory.data.get("autonomy_reviews", []):
            domain = str(review.get("domain", "general")).casefold()
            stamp = self.trust_engine._parse_datetime(review.get("at"))
            if stamp and (domain not in latest or stamp > (self.trust_engine._parse_datetime(latest[domain].get("at")) or stamp)):
                latest[domain] = review
        due = []
        for domain, consent in self.memory.data.get("domain_consents", {}).items():
            if not isinstance(consent, dict) or not consent.get("granted"):
                continue
            reference = self.trust_engine._parse_datetime(latest.get(domain, {}).get("at") or consent.get("granted_at"))
            if reference and (current - reference).days >= self.config.dependency_review_days:
                due.append(domain)
        return {"due": sorted(due), "interval_days": self.config.dependency_review_days, "last_reviews": deepcopy(latest), "manual_mode": self.manual_mode}

    def record_autonomy_review(self, domain: str, choice: str = "maintain", actor: str = "owner") -> Dict[str, Any]:
        normalized_choice = str(choice or "maintain").casefold()
        normalized_domain = str(domain or "general").casefold()
        review = {"domain": normalized_domain, "choice": normalized_choice, "actor": actor, "at": datetime.now(timezone.utc).isoformat()}
        self.memory.data.setdefault("autonomy_reviews", []).append(review)
        if normalized_choice in {"reduce", "manual", "stop", "ask_always"}:
            self.revoke_domain_consent(normalized_domain, actor)
        elif normalized_choice in {"maintain", "renew"}:
            consent = self.memory.data.get("domain_consents", {}).get(normalized_domain)
            if isinstance(consent, dict) and consent.get("granted"):
                renewed_until = datetime.now(timezone.utc) + timedelta(days=self.config.autonomy_consent_renewal_days)
                consent["expires_at"] = renewed_until.isoformat()
                consent["renewed_at"] = review["at"]
        if normalized_choice in {"all_manual", "stop_all", "ask_always_all"}:
            self.set_manual_mode(True, actor)
        self.memory.record_audit({"event": "autonomy_review", **review})
        self.memory.save()
        return review

    def set_manual_mode(self, enabled: bool = True, actor: str = "owner") -> bool:
        """Interruttore globale: l'utente può tornare a controllare tutto in un tap."""
        self.manual_mode = bool(enabled)
        self.memory.data["manual_mode"] = self.manual_mode
        self.memory.record_audit({"event": "manual_mode_changed", "enabled": self.manual_mode, "actor": actor})
        self.memory.save()
        return self.manual_mode

    def stop_and_ask_always(self, actor: str = "owner") -> bool:
        return self.set_manual_mode(True, actor)

    def import_historical_data(self, records: Iterable[Dict[str, Any]], authorized: bool = False, source: str = "user_export") -> Dict[str, Any]:
        """Importa pattern storici solo dopo consenso esplicito e senza inventare dati."""
        if not authorized:
            self.memory.record_security_event({"event": "historical_import_denied", "source": source})
            self.memory.record_audit({"event": "historical_import_denied", "source": source})
            return {"imported": 0, "requires_consent": True, "phase": "import"}
        imported = 0
        invalid = 0
        for item in records or []:
            if not isinstance(item, dict) or not (item.get("action_type") or item.get("action")):
                invalid += 1
                continue
            action_type = str(item.get("action_type") or item.get("action"))
            result = self.trust_engine.update(
                action_type,
                item.get("counterparty") or item.get("provider"),
                item.get("context") or item.get("category"),
                outcome=str(item.get("outcome", "approved")),
                response_time_seconds=item.get("response_time_seconds", item.get("latency_seconds")),
                at=item.get("at") or item.get("created_at"),
            )
            key = result["key"]
            if key in self.memory.data.get("trust_profiles", {}):
                self.memory.data["trust_profiles"][key]["source"] = "historical_import"
            imported += 1
        cold_start = self.memory.data.setdefault("cold_start", {})
        cold_start.update({"phase": "calibration", "historical_imported": imported > 0, "imported_count": imported, "invalid_count": invalid, "imported_at": datetime.now(timezone.utc).isoformat(), "source": source})
        self.memory.record_consent("historical_import", True)
        self.memory.record_audit({"event": "historical_import", "source": source, "imported": imported, "invalid": invalid})
        self.memory.save()
        return {"imported": imported, "invalid": invalid, "requires_consent": False, "phase": "calibration"}

    def import_history(self, records: Iterable[Dict[str, Any]], authorized: bool = False, source: str = "user_export") -> Dict[str, Any]:
        return self.import_historical_data(records, authorized, source)

    def cold_start_status(self) -> Dict[str, Any]:
        cold_start = deepcopy(self.memory.data.get("cold_start", {}))
        return {
            **cold_start,
            "phases": ["import", "calibration", "pilot_wow", "controlled_decay"],
            "calibration": self.calibration_status(),
            "import_consent": bool(self.memory.data.get("consents", {}).get("historical_import", {}).get("granted")),
            "first_wow_candidates": len(self.memory.data.get("silent_costs", [])) + len(self.memory.data.get("hidden_deadlines", [])),
        }

    def first_wow_candidates(self) -> List[Dict[str, Any]]:
        candidates = []
        for item in self.memory.data.get("silent_costs", []):
            candidates.append({"type": "silent_cost", "item": deepcopy(item), "safe": True})
        for item in self.memory.data.get("hidden_deadlines", []):
            candidates.append({"type": "hidden_deadline", "item": deepcopy(item), "safe": True})
        return candidates

    def money_spend_total(self, month: Optional[str] = None) -> float:
        period = month or datetime.now(timezone.utc).strftime("%Y-%m")
        total = 0.0
        for item in self.memory.data.get("money_spend", []):
            stamp = str(item.get("at", ""))
            if stamp[:7] == period:
                total += max(0.0, float(item.get("amount_eur", 0) or 0))
        return round(total, 2)

    def can_autonomously_spend(self, amount_eur: float, month: Optional[str] = None) -> Dict[str, Any]:
        amount = max(0.0, float(amount_eur))
        current_month = month or datetime.now(timezone.utc).strftime("%Y-%m")
        current_total = self.money_spend_total(current_month)
        reasons = []
        allowed = bool(self.config.autonomous_money_enabled)
        if not allowed:
            reasons.append("autonomia monetaria disattivata nella configurazione demo")
        if amount > self.config.money_single_transaction_cap_eur:
            allowed = False
            reasons.append("oltre il tetto per singola transazione")
        if current_total + amount > self.config.money_monthly_cap_eur:
            allowed = False
            reasons.append("oltre il tetto cumulativo mensile")
        if self.manual_mode:
            allowed = False
            reasons.append("modalità manuale globale attiva")
        if not self.has_domain_consent("money"):
            allowed = False
            reasons.append("manca consenso rinnovabile specifico per denaro")
        return {"allowed": allowed, "amount_eur": amount, "month": current_month, "spent_eur": current_total, "single_cap_eur": self.config.money_single_transaction_cap_eur, "monthly_cap_eur": self.config.money_monthly_cap_eur, "reasons": reasons}

    def money_guard(self, amount_eur: float, month: Optional[str] = None) -> Dict[str, Any]:
        return self.can_autonomously_spend(amount_eur, month)

    def record_money_spend(self, amount_eur: float, reference: str = "", autonomous: bool = False, at: Optional[Union[str, datetime]] = None) -> Dict[str, Any]:
        timestamp = at.isoformat() if isinstance(at, datetime) else str(at or datetime.now(timezone.utc).isoformat())
        spend = {"amount_eur": max(0.0, float(amount_eur)), "reference": reference, "autonomous": bool(autonomous), "at": timestamp}
        if autonomous:
            guard = self.can_autonomously_spend(spend["amount_eur"], timestamp[:7])
            if not guard["allowed"]:
                self.memory.record_security_event({"event": "money_spend_blocked", "reference": reference, "amount_eur": spend["amount_eur"], "reasons": guard["reasons"]})
                self.memory.record_audit({"event": "money_spend_blocked", "reference": reference, "amount_eur": spend["amount_eur"], "reasons": guard["reasons"]})
                return {**spend, "recorded": False, "blocked_reasons": guard["reasons"]}
        self.memory.data.setdefault("money_spend", []).append(spend)
        self.memory.record_audit({"event": "money_spend_recorded", **spend})
        self.memory.save()
        return {**spend, "recorded": True}

    def record_execution_error(
        self,
        task: Union[Task, str],
        error: str,
        domain: Optional[str] = None,
        damage_eur: float = 0.0,
        detected_at: Optional[Union[str, datetime]] = None,
    ) -> Dict[str, Any]:
        """Applica il protocollo di crisi senza nascondere l'errore all'utente."""
        current_task = task if isinstance(task, Task) else Task(str(task), category=domain or "general")
        timestamp = detected_at.isoformat() if isinstance(detected_at, datetime) else str(detected_at or datetime.now(timezone.utc).isoformat())
        trust_update = self.trust_engine.update_task(current_task, "error", at=timestamp)
        event = {
            "id": f"error-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
            "type": "execution_error",
            "task": asdict(current_task),
            "domain": domain or current_task.category,
            "error": str(error),
            "damage_eur": max(0.0, float(damage_eur)),
            "detected_at": timestamp,
            "severity": "high" if (domain or current_task.category).casefold() in {"money", "health", "legal", "contract"} else "standard",
            "trust_key": trust_update["key"],
            "trust_before": trust_update["score_before"],
            "trust_after": trust_update["score_after"],
            "status": "open",
        }
        self.memory.data.setdefault("execution_errors", []).append(event)
        self.memory.data.setdefault("crisis_events", []).append({"error_id": event["id"], "at": timestamp, "trust_reduced": True, "severity": event["severity"]})
        self.memory.data.setdefault("business_metrics", {})["execution_errors"] = int(self.memory.data["business_metrics"].get("execution_errors", 0)) + 1
        self.memory.record_security_event({"event": "execution_error", "error_id": event["id"], "domain": event["domain"], "severity": event["severity"]})
        self.memory.record_audit({"event": "execution_error", "error": event})
        self.memory.save()
        event["user_message"] = f"Ho commesso un errore: {error}. Ho ridotto temporaneamente la fiducia solo per questa combinazione ({trust_update['score_after']:.0f}/100) e ho aperto una revisione."
        event["next_steps"] = ["verificare l'esito presso il servizio coinvolto", "correggere o annullare se il servizio lo consente", "contattare il supporto o il fondo di garanzia se c'è un danno"]
        return event

    def record_error(self, task: Union[Task, str], error: str, domain: Optional[str] = None, damage_eur: float = 0.0) -> Dict[str, Any]:
        return self.record_execution_error(task, error, domain, damage_eur)

    def resolve_error(self, error_id: str, resolution: str = "") -> bool:
        return self.resolve_execution_error(error_id, resolution)

    def resolve_execution_error(self, error_id: str, resolution: str = "") -> bool:
        for error in reversed(self.memory.data.get("execution_errors", [])):
            if error.get("id") == error_id and error.get("status") != "resolved":
                error["status"] = "resolved"
                error["resolved_at"] = datetime.now(timezone.utc).isoformat()
                error["resolution"] = resolution or "revisione completata"
                self.memory.record_audit({"event": "execution_error_resolved", "error_id": error_id, "resolution": error["resolution"]})
                self.memory.save()
                return True
        return False

    def crisis_report(self) -> Dict[str, Any]:
        errors = self.memory.data.get("execution_errors", [])
        return {"open_errors": deepcopy([item for item in errors if item.get("status", "open") != "resolved"]), "recent_events": deepcopy(self.memory.data.get("crisis_events", [])), "guarantee": deepcopy(self.config.insurance_or_guarantee), "promise": "trasparenza immediata, correzione verificabile e responsabilità economica dichiarata; non zero errori"}

    def dependency_check(self, signals: Optional[Dict[str, Any]] = None, now: Optional[datetime] = None) -> Dict[str, Any]:
        """Rileva affidamento eccessivo e propone più riepilogo, mai meno."""
        signals = dict(signals or {})
        review = self.autonomy_review_status(now)
        triggers = []
        if review["due"]:
            triggers.append("revisione periodica scaduta")
        if signals.get("cannot_recall_managed_domains") or signals.get("missed_summaries") or signals.get("delegated_without_review"):
            triggers.append("segnali di disimpegno o perdita di consapevolezza")
        vulnerable = bool(triggers)
        return {"vulnerable": vulnerable, "triggers": triggers, "increase_digest": vulnerable, "suggest_human_or_professional": vulnerable, "manual_override_available": True, "message": "Aumento i riepiloghi comprensibili e ti propongo una revisione dell'autonomia." if vulnerable else "Nessun segnale rilevato; mantieni comunque il controllo manuale disponibile."}

    def check_dependency(self, signals: Optional[Dict[str, Any]] = None, now: Optional[datetime] = None) -> Dict[str, Any]:
        return self.dependency_check(signals, now)

    def record_compute_usage(self, operation: str, units: float = 1, cost_eur: float = 0.0, model: str = "local-small") -> Dict[str, Any]:
        event = {"operation": operation, "units": max(0.0, float(units)), "cost_eur": max(0.0, float(cost_eur)), "model": model, "at": datetime.now(timezone.utc).isoformat()}
        self.memory.record_compute_event(event)
        return event

    def computational_metrics(self) -> Dict[str, Any]:
        events = self.memory.data.get("compute_events", [])
        cost = sum(float(item.get("cost_eur", 0) or 0) for item in events)
        units = sum(float(item.get("units", 0) or 0) for item in events)
        return {"events": len(events), "units": round(units, 2), "cost_eur": round(cost, 4), "target_eur": self.config.compute_cost_target_eur, "monitoring": "event_driven" if self.config.event_driven_monitoring else "polling_configured", "ai_policy": "modelli piccoli per pattern matching; modello principale solo per ambiguità"}

    def enqueue_event(self, event_type: str, payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        event = {"type": event_type, "payload": deepcopy(payload or {}), "at": datetime.now(timezone.utc).isoformat()}
        self.memory.record_event(event)
        return event

    def business_summary(self) -> Dict[str, Any]:
        metrics = {**Memory.DEFAULT_DATA["business_metrics"], **self.memory.data.get("business_metrics", {})}
        actions = int(metrics.get("actions_executed", 0) or 0)
        errors = int(metrics.get("execution_errors", 0) or 0)
        metrics["error_rate_per_1000"] = round((errors / actions) * 1000, 2) if actions else 0.0
        metrics["guarantee_cost_ratio"] = round(float(metrics.get("guarantee_cost_eur", 0) or 0) / float(metrics.get("revenue_eur", 0) or 1), 4) if metrics.get("revenue_eur") else 0.0
        return {"active_plan": self.config.business_plan, "plans": deepcopy(BUSINESS_PLANS), "metrics": metrics, "autonomous_money_enabled": self.config.autonomous_money_enabled}

    def business_metrics(self) -> Dict[str, Any]:
        return self.business_summary()

    def record_automation_disabled(self, title: str = "") -> None:
        metrics = self.memory.data.setdefault("business_metrics", {})
        metrics["automations_disabled"] = int(metrics.get("automations_disabled", 0) or 0) + 1
        self.memory.record_audit({"event": "automation_disabled", "title": title})
        self.memory.save()

    def master_policy_summary(self) -> Dict[str, Any]:
        return {
            "domains": ["home", "money", "health", "errands", "family"],
            "execution_architecture": ["read_only", "human_in_the_loop", "scoped_autonomy"],
            "trust": self.trust_summary(),
            "privacy": self.privacy_summary(),
            "never_do": list(self.config.never_do),
            "manual_mode": self.manual_mode,
            "event_driven_monitoring": self.config.event_driven_monitoring,
            "business": self.business_summary(),
            "cold_start": self.cold_start_status(),
            "dependency": self.dependency_check(),
            "crisis": self.crisis_report(),
            "autonomy_review": self.autonomy_review_status(),
            "audit": self.memory.verify_audit_log(),
        }

    def explain_action(self, task: Union[Task, str]) -> str:
        return self.explain(task)

    def rollback(self, title: str) -> bool:
        return self.undo(title)

    def rerun(self, title: str) -> bool:
        return self.redo(title)

    def trust_profile(self, action_type: str, counterparty: Optional[str] = None, context: Optional[str] = None) -> Dict[str, Any]:
        return self.trust_engine.profile(action_type, counterparty, context)

    def trust_score(self, action_type: str, counterparty: Optional[str] = None, context: Optional[str] = None) -> float:
        return float(self.trust_profile(action_type, counterparty, context)["score"])

    def set_trust_score(self, action_type: str, counterparty: str, context: str, score: float) -> Dict[str, Any]:
        """Imposta un valore solo per migrazioni o configurazioni esplicite, mai da input esterno implicito."""
        return self.trust_engine.set_score(action_type, counterparty, context, score)

    def record_trust_interaction(
        self,
        task: Task,
        outcome: str = "approved",
        response_time_seconds: Optional[float] = None,
        at: Optional[Union[str, datetime]] = None,
        latency_seconds: Optional[float] = None,
    ) -> Dict[str, Any]:
        return self.trust_engine.update_task(task, outcome, response_time_seconds, at, latency_seconds)

    def trust_profiles(self) -> List[Dict[str, Any]]:
        return self.trust_engine.profiles()

    def trust_summary(self) -> Dict[str, Any]:
        profiles = self.trust_profiles()
        average = sum(item["score"] for item in profiles) / len(profiles) if profiles else self.config.trust_baseline_score
        return {
            "average_score": round(average, 2),
            "profile_count": len(profiles),
            "baseline_score": self.config.trust_baseline_score,
            "auto_execute_score": self.config.trust_auto_execute_score,
            "report_score": self.config.trust_report_score,
            "max_spend_eur": self.config.trust_max_spend_eur,
            "sensitive_caps": deepcopy(self.config.trust_sensitive_caps),
        }

    def classify(self, task: Task) -> Decision:
        """Classifica con fiducia continua; il livello è solo una banda compatibile per la UI.

        La decisione usa sempre la combinazione precisa di azione, controparte e
        contesto. Le regole di sicurezza vengono prima del punteggio e i domini
        sensibili hanno un tetto che il punteggio non può oltrepassare.
        """
        self._reset_daily_notifications()
        category = (task.category or "general").casefold()
        trust = self.trust_engine.evaluate(task)
        trust_label = (
            f"fiducia {trust['score']:.0f}/100 per {trust['action_type']} · "
            f"{trust['counterparty']} · {trust['context']}"
        )
        if self._is_suspicious(task):
            # Una possibile frode non viene mai silenziata da pausa o manual mode.
            return self._decision(task, f"attività sospetta: serve una verifica immediata · {trust_label}", trust)
        if self.paused:
            return self._decision(task, "agente in pausa: nessuna automazione viene eseguita", trust)
        if self.manual_mode:
            return self._decision(task, "modalità manuale globale: l'utente ha scelto di approvare sempre", trust)
        if self._matches_rule(task, self.config.never_automate):
            return self._decision(task, f"argomento escluso dall'automazione · {trust_label}", trust)
        rejection_keys = self.memory.data.get("rejection_keys", [])
        rejected_for_key = trust["key"] in rejection_keys
        rejected_legacy = not rejection_keys and self._matches_rule(task, self.memory.data.get("rejections", []))
        if (rejected_for_key or rejected_legacy) and not task.new_elements.strip():
            return self._decision(task, f"l'utente ha rifiutato in precedenza questa combinazione · {trust_label}", trust)
        text = f"{task.title} {task.details}".casefold()
        if any(term in text for term in HEALTH_ADVICE_TERMS + LEGAL_ADVICE_TERMS + FINANCIAL_ADVICE_TERMS):
            return self._decision(task, "richiesta informativa sensibile: serve un professionista, nessun consiglio vincolante", trust)
        if (task.action_type or task.action).casefold() in IRREVERSIBLE_ACTIONS or not task.reversible:
            return self._decision(task, f"azione irreversibile o non reversibile · {trust_label}", trust)
        if category in SENSITIVE_CATEGORIES:
            cap_note = f"tetto assoluto {trust['cap']:.0f}/100" if trust.get("cap") is not None else "tetto di sicurezza attivo"
            money_note = ""
            if category == "money":
                money_note = f" · tetto transazione € {self.config.money_single_transaction_cap_eur:.0f} / mese € {self.config.money_monthly_cap_eur:.0f}"
            if task.preapproved and task.permanent_authorization:
                return self._report(task, f"autorizzazione permanente registrata, ma {cap_note}: massimo Livello 2{money_note}", trust)
            return self._decision(task, f"dominio sensibile: serve autorizzazione esplicita per questo caso · {cap_note}{money_note} · {trust_label}", trust)
        if task.affects_family or category == "family":
            return self._decision(task, f"l'azione ha impatto su altri membri della famiglia · {trust_label}", trust)
        if task.urgent:
            return self._decision(task, f"scadenza o evento urgente · {trust_label}", trust)
        dnd_active = self.assess_context(task.context).get("active", False)
        if dnd_active and task.reversible and trust["effective_score"] >= self.config.trust_report_score:
            return self._report(task, f"Non disturbare intelligente attivo: attività non urgente rimandata al digest · {trust_label}", trust)
        if any(term in text for term in AMBIGUOUS_TERMS) and not task.preapproved:
            return self._decision(task, f"richiesta ambigua: serve una scelta esplicita · {trust_label}", trust)
        if task.preapproved:
            return self._silent(task, f"autorizzazione esplicita già registrata e attività reversibile · {trust_label}", trust)
        if trust["source"] == "imported":
            return self._decision(task, f"{trust_label}; proposta importata da una combinazione simile, serve conferma esplicita", trust)
        amount = None if task.amount_eur is None else float(task.amount_eur)
        dynamic_limit = trust["dynamic_spend_limit_eur"]
        if amount is not None and amount > dynamic_limit:
            return self._decision(task, f"fiducia insufficiente: importo di € {amount:.2f} oltre il limite dinamico di € {dynamic_limit:.2f} · {trust_label}", trust)
        if trust["effective_score"] >= self.config.trust_auto_execute_score and task.reversible:
            return self._silent(task, f"fiducia sufficiente per agire autonomamente entro € {dynamic_limit:.2f} · {trust_label}", trust)
        if trust["effective_score"] >= self.config.trust_report_score and task.reversible:
            return self._report(task, f"fiducia sufficiente per eseguire e informare · {trust_label}", trust)
        # Un'attività puramente locale e senza costo decisionale non rappresenta
        # un'autorizzazione verso una controparte sconosciuta.
        if not trust["has_specific_counterparty"] and amount is None and (task.action_type or task.action).casefold() == "monitor":
            return self._report(task, f"attività locale a basso rischio · {trust_label}", trust)
        return self._decision(task, f"fiducia insufficiente per questa combinazione · {trust_label}", trust)

    def analyze_silent_cost(self, subscriptions: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
        findings = []
        seen = set()
        for item in subscriptions:
            name = str(item.get("name", "servizio")).strip()
            key = name.casefold()
            unused_days = int(item.get("unused_days", 0) or 0)
            duplicate = key in seen or bool(item.get("duplicate_with"))
            if unused_days >= 90 or duplicate:
                finding = {**item, "reason": "inutilizzato da almeno 3 mesi" if unused_days >= 90 else "possibile servizio duplicato"}
                findings.append(finding)
                self.memory.record_silent_cost(finding)
            seen.add(key)
        return findings

    def assess_context(self, context: str) -> Dict[str, Any]:
        normalized = str(context or "").casefold()
        aliases = {
            "travel": ("travel", "viaggio", "trasferta"),
            "holiday": ("holiday", "vacanza", "festiv", "ferie"),
            "family_weekend": ("family_weekend", "weekend con la famiglia", "weekend in famiglia"),
        }
        active = any(
            alias.casefold() in normalized
            for item in self.config.dnd_contexts
            for alias in aliases.get(str(item).casefold(), (str(item),))
        )
        return {"active": active, "context": context, "policy": "defer_non_urgent" if active else "normal", "reason": "contesto delicato" if active else "nessun contesto delicato"}

    def route_decision(self, decision: Decision, recipient: Optional[str] = None) -> Decision:
        decision.routed_to = recipient or decision.task.recipient or self.config.routing_rules.get(decision.task.category)
        return decision

    def register_document(self, document: Dict[str, Any]) -> None:
        """Archivia localmente un documento già ricevuto e lo collega al contesto noto."""
        archived = {
            **document,
            "document_type": document.get("document_type", document.get("type", "document")),
            "linked_deadline": document.get("linked_deadline", document.get("deadline")),
            "archived_at": datetime.now(timezone.utc).isoformat(),
        }
        self.memory.record_document(archived)
        self.memory.record_audit({"event": "document_archived", "document_type": archived["document_type"], "linked_deadline": archived["linked_deadline"]})

    def scan_hidden_deadlines(self, items: Iterable[Dict[str, Any]]) -> List[Dict[str, Any]]:
        findings = []
        for item in items:
            days = item.get("days_remaining")
            if days is not None and 0 <= int(days) <= 30:
                finding = dict(item)
                findings.append(finding)
                self.memory.record_hidden_deadline(finding)
                self.memory.record_audit({"event": "hidden_deadline_detected", "name": finding.get("name"), "days_remaining": finding.get("days_remaining")})
        return findings

    def monthly_digest(self) -> str:
        costs = self.memory.data.get("silent_costs", [])
        deadlines = self.memory.data.get("hidden_deadlines", [])
        return "\n".join([
            "📋 Digest mensile · costi silenziosi",
            "💸 Da verificare: " + (", ".join(item.get("name", "servizio") for item in costs) or "nulla"),
            "⏳ Scadenze nascoste: " + (", ".join(item.get("name", "scadenza") for item in deadlines) or "nulla"),
        ])

    def default_outcome(self, task: Task) -> str:
        return task.default_outcome

    def metrics(self) -> Dict[str, Any]:
        metrics = dict(self.memory.data.get("metrics", {}))
        total = int(metrics.get("level3_total", 0))
        deescalated = int(metrics.get("level3_deescalated", 0))
        metrics["deescalation_rate"] = round((deescalated / total) * 100, 1) if total else 0.0
        metrics["calibration_active"] = self.calibration_active()
        metrics["notifications_avoided"] = int(metrics.get("notifications_avoided", 0))
        metrics["time_saved_minutes"] = int(metrics.get("time_saved_minutes", 0))
        return metrics

    def record_deescalation(self, title: str) -> None:
        self.memory.record_metric("level3_deescalated")
        rule = {"title": title, "approved": True, "created_at": datetime.now(timezone.utc).isoformat()}
        self.memory.data.setdefault("automation_rules", []).append(rule)
        self.memory.remember_preference(f"automation:{title.casefold()}", rule)

    def record_integration_failure(self, connector: str, message: str, priority: str = "technical") -> Dict[str, Any]:
        failure = {
            "id": f"{connector}-{int(datetime.now(timezone.utc).timestamp() * 1000)}",
            "connector": connector,
            "message": message,
            "priority": priority,
            "status": "open",
            "at": datetime.now(timezone.utc).isoformat(),
        }
        self.memory.record_integration_failure(failure)
        self.memory.record_audit({"event": "integration_failure", "failure": failure})
        return failure

    def resolve_integration_failure(self, failure_id: str) -> bool:
        for failure in reversed(self.memory.data.get("integration_failures", [])):
            if failure.get("id") == failure_id and failure.get("status") != "resolved":
                failure["status"] = "resolved"
                failure["resolved_at"] = datetime.now(timezone.utc).isoformat()
                self.memory.record_audit({"event": "integration_failure_resolved", "failure_id": failure_id})
                self.memory.save()
                return True
        return False

    def technical_issues(self) -> List[Dict[str, Any]]:
        return [item for item in self.memory.data.get("integration_failures", []) if item.get("status", "open") != "resolved"]

    def technical_digest(self) -> str:
        failures = self.technical_issues()
        return "\n".join([
            "🛠 Problemi tecnici (separati dalle decisioni)",
            " · ".join(f"{item.get('connector')}: {item.get('message')} [{item.get('priority', 'technical')}]" for item in failures) or "nessuno",
        ])

    def seasonal_forecast(self, month: Optional[int] = None) -> List[Dict[str, Any]]:
        selected_month = month or datetime.now(timezone.utc).month
        findings = []
        for item in self.config.seasonal_periods:
            try:
                item_month = int(item.get("month", 0))
            except (TypeError, ValueError):
                continue
            if item_month == selected_month:
                findings.append(dict(item))
        return findings

    def upcoming_seasonal_periods(self, reference: Optional[datetime] = None, horizon_days: int = 45) -> List[Dict[str, Any]]:
        """Restituisce i periodi stagionali imminenti, includendo il passaggio di anno."""
        now = reference or datetime.now(timezone.utc)
        results = []
        for item in self.config.seasonal_periods:
            try:
                month = int(item.get("month"))
                day = int(item.get("day", 1))
                candidate = now.replace(month=month, day=day, hour=0, minute=0, second=0, microsecond=0)
                if candidate < now:
                    candidate = candidate.replace(year=now.year + 1)
            except (TypeError, ValueError):
                continue
            days = (candidate - now).days
            lead_days = int(item.get("lead_days", 30) or 30)
            if 0 <= days <= max(horizon_days, lead_days):
                results.append({**item, "days_until": days, "status": "anticipate"})
        return sorted(results, key=lambda item: item["days_until"])

    def privacy_summary(self) -> Dict[str, Any]:
        return {
            "retention_days": self.config.data_retention_days,
            "audit_retention_days": self.config.audit_retention_days,
            "legal_basis": self.config.legal_basis,
            "third_party_sharing": self.config.third_party_sharing,
            "commercial_data_sale": False,
            "shared_data": "solo con autorizzazione esplicita per ogni caso" if not self.config.third_party_sharing else "solo dati e finalità autorizzati",
            "data_locations": "memoria locale della demo; nessun servizio terzo collegato",
            "domain_consents": {domain: self.domain_consent_status(domain) for domain in self.memory.data.get("domain_consents", {})},
            "rights": ["access", "export", "delete", "withdraw_consent", "rectification"],
            "audit": self.memory.verify_audit_log(),
        }

    def share_data(self, category: str, recipient: str, purpose: str, authorized: bool = False) -> bool:
        """Blocca ogni condivisione sensibile finché non esiste consenso esplicito."""
        if category.casefold() in SENSITIVE_CATEGORIES and not authorized:
            self.memory.record_security_event({"event": "sharing_denied", "category": category, "recipient": recipient, "purpose": purpose})
            self.memory.record_audit({"event": "sensitive_share_denied", "category": category, "recipient": recipient, "purpose": purpose})
            return False
        self.memory.record_consent(f"share:{recipient}:{purpose}", authorized)
        self.memory.record_audit({"event": "data_share", "category": category, "recipient": recipient, "purpose": purpose, "authorized": bool(authorized)})
        return bool(authorized)

    def export_personal_data(self) -> Dict[str, Any]:
        return {"export_version": 1, "memory": deepcopy(self.memory.data), "privacy": self.privacy_summary()}

    def purge_expired_data(self, now: Optional[datetime] = None) -> int:
        return self.memory.purge_expired(self.config.data_retention_days, now=now)

    def plan_offboarding(self) -> Dict[str, Any]:
        package = {
            "created_at": datetime.now(timezone.utc).isoformat(),
            "pending": [asdict(item) for item in self.pending],
            "active_preferences": deepcopy(self.memory.data.get("preferences", {})),
            "hidden_deadlines": deepcopy(self.memory.data.get("hidden_deadlines", [])),
            "documents": deepcopy(self.memory.data.get("documents", [])),
            "automation_rules": deepcopy(self.memory.data.get("automation_rules", [])),
            "trust_profiles": deepcopy(self.memory.data.get("trust_profiles", {})),
            "trust_interactions": deepcopy(self.memory.data.get("trust_interactions", [])),
            "trust_proposals": deepcopy(self.memory.data.get("trust_proposals", [])),
            "technical_issues": deepcopy(self.technical_issues()),
            "active_consents": deepcopy(self.memory.data.get("domain_consents", {})),
            "event_queue": deepcopy(self.memory.data.get("event_queue", [])),
            "audit_head": self.memory.data.get("audit_head", ""),
            "retention_policy": self.privacy_summary(),
            "scheduled_automations": deepcopy(self.memory.data.get("automation_rules", [])),
            "next_step": "assegnare manualmente le scadenze aperte, revocare i token esterni e confermare il nuovo responsabile",
        }
        self.memory.data["offboarding"] = {"paused": True, "handover": package, "external_tokens_to_revoke": True, "automations_cancelled": False}
        self.memory.record_offboarding({"event": "plan_created", "at": package["created_at"], "pending_count": len(self.pending)})
        return package

    def offboard(self, delegate: Optional[str] = None) -> Dict[str, Any]:
        package = self.plan_offboarding()
        if delegate:
            package["delegate"] = delegate
            self.memory.data["offboarding"]["handover"]["delegate"] = delegate
        self.paused = True
        self.memory.save()
        return package

    def pause(self) -> None:
        self.paused = True
        self.memory.data["offboarding"] = {**self.memory.data.get("offboarding", {}), "paused": True, "mode": "paused"}
        self.memory.record_audit({"event": "agent_paused"})
        self.memory.save()

    def resume(self) -> None:
        self.paused = False
        self.memory.data["offboarding"] = {**self.memory.data.get("offboarding", {}), "paused": False, "mode": "active"}
        self.memory.record_audit({"event": "agent_resumed"})
        self.memory.save()

    def _assign_notification(self, decision: Decision) -> None:
        self._reset_daily_notifications()
        if decision.task.urgent or self._is_suspicious(decision.task) or self.notifications_today < self.effective_notification_limit():
            decision.active_notification = True
            self.notifications_today += 1
        else:
            decision.notification_queued = True
            self.queued_notifications.append(decision)

    def process(self, task: Task) -> Decision:
        # I connettori reali dovranno chiamare questo confine; la demo registra
        # il costo logico dell'operazione senza effettuare chiamate esterne.
        self.memory.record_compute_event({"operation": "classify", "units": 1, "cost_eur": 0.0, "model": "local-rules", "at": datetime.now(timezone.utc).isoformat()})
        decision = self.classify(task)
        decision.calibration_notice = self.calibration_active()
        if decision.calibration_notice and decision.level in (AutonomyLevel.EXECUTE_SILENTLY, AutonomyLevel.EXECUTE_AND_REPORT):
            # Durante la prova anche le azioni normalmente silenziose sono spiegate.
            decision.active_notification = True
            self.memory.record_metric("calibration_notifications")
        if decision.level == AutonomyLevel.ASK_FIRST:
            self.pending.append(decision)
            self._assign_notification(decision)
            if decision.active_notification:
                self.memory.record_metric("notifications_total")
        else:
            self.memory.record_completion(task)
            self.completed_today.append(task)
            self.memory.record_metric("notifications_avoided")
            self.memory.record_metric("time_saved_minutes", 5 if decision.level == AutonomyLevel.EXECUTE_SILENTLY else 3)
            business = self.memory.data.setdefault("business_metrics", {})
            business["actions_executed"] = int(business.get("actions_executed", 0) or 0) + 1
            business["automations_never_disabled"] = int(business.get("automations_never_disabled", 0) or 0) + 1
            action = {
                "task": asdict(task),
                "status": "completed",
                "level": int(decision.level),
                "reason": decision.reason,
                "explanation": decision.explanation or decision.reason,
                "at": datetime.now(timezone.utc).isoformat(),
            }
            self.action_history.append(action)
            self.memory.record_action(action)
        if decision.level == AutonomyLevel.ASK_FIRST:
            self.memory.record_metric("level3_total")
        return decision

    def approve(self, title: str, actor: str = "owner") -> bool:
        for index, decision in enumerate(self.pending):
            if decision.task.title.casefold() == title.casefold():
                if not self.can_approve(actor, decision.task.category, "approve"):
                    self.memory.record_security_event({"event": "approval_denied", "actor": actor, "title": title})
                    return False
                approval_at = datetime.now(timezone.utc)
                created_at = self.trust_engine._parse_datetime(decision.task.created_at, approval_at) or approval_at
                response_time_seconds = max(0.0, (approval_at - created_at).total_seconds())
                trust_interaction = self.record_trust_interaction(
                    decision.task,
                    "approved",
                    response_time_seconds=response_time_seconds,
                    at=approval_at,
                )
                self.memory.record_completion(decision.task)
                self.last_automation_suggestion = (
                    decision.task.title if self.memory.record_approval(decision.task.title) else None
                )
                approval_count = self.memory.data["approved_counts"].get(decision.task.title, 0)
                self.memory.remember_pattern(
                    f"approval:{decision.task.category}:{decision.task.action}",
                    {"title": decision.task.title, "count": approval_count},
                )
                self.pending.pop(index)
                self.queued_notifications = [item for item in self.queued_notifications if item is not decision]
                action = {
                    "task": asdict(decision.task),
                    "status": "completed",
                    "level": int(decision.level),
                    "reason": decision.reason,
                    "explanation": decision.explanation or decision.reason,
                    "approved_by": actor,
                    "at": approval_at.isoformat(),
                    "trust_score_after": trust_interaction["score_after"],
                    "trust_key": trust_interaction["key"],
                }
                self.action_history.append(action)
                self.memory.record_action(action)
                self.memory.record_metric("level3_approved")
                business = self.memory.data.setdefault("business_metrics", {})
                business["actions_executed"] = int(business.get("actions_executed", 0) or 0) + 1
                business["automations_never_disabled"] = int(business.get("automations_never_disabled", 0) or 0) + 1
                self.memory.record_audit({"event": "decision_approved", "title": decision.task.title, "actor": actor, "trust_score_after": trust_interaction["score_after"]})
                self.memory.save()
                return True
        return False

    def undo(self, title: str) -> bool:
        for action in reversed(self.action_history):
            task = action.get("task", {})
            if task.get("title", "").casefold() == title.casefold() and action.get("status") == "completed":
                if not task.get("reversible", True):
                    self.memory.record_security_event({"event": "undo_denied", "title": title, "reason": "azione non reversibile"})
                    return False
                action["status"] = "undone"
                action["undone_at"] = datetime.now(timezone.utc).isoformat()
                self.memory.record_undo({"title": title, "action": "undo", "at": action["undone_at"]})
                self.memory.data["action_log"] = deepcopy(self.action_history)
                self.memory.save()
                return True
        return False

    def redo(self, title: str) -> bool:
        for action in reversed(self.action_history):
            task = action.get("task", {})
            if task.get("title", "").casefold() == title.casefold() and action.get("status") == "undone":
                if not task.get("reversible", True):
                    return False
                action["status"] = "completed"
                action["redone_at"] = datetime.now(timezone.utc).isoformat()
                self.memory.record_undo({"title": title, "action": "redo", "at": action["redone_at"]})
                self.memory.data["action_log"] = deepcopy(self.action_history)
                self.memory.save()
                return True
        return False

    def reject(self, title: str) -> bool:
        for index, decision in enumerate(self.pending):
            if decision.task.title.casefold() == title.casefold():
                rejected_at = datetime.now(timezone.utc)
                self.record_trust_interaction(decision.task, "rejected", at=rejected_at)
                self.memory.reject(decision.task.title, decision.trust_key)
                self.memory.record_security_event({"event": "decision_rejected", "title": decision.task.title, "at": rejected_at.isoformat()})
                self.pending.pop(index)
                self.queued_notifications = [item for item in self.queued_notifications if item is not decision]
                self.memory.record_audit({"event": "decision_rejected", "title": decision.task.title, "trust_score_after": self.trust_engine.get_score(decision.task.action_type or decision.task.action, decision.task.counterparty or decision.task.provider, decision.task.context or decision.task.category)})
                return True
        return False

    def digest(self, completed: Optional[Iterable[Task]] = None) -> str:
        tasks = list(self.completed_today if completed is None else completed)
        lines = ["📋 Riepilogo", "✅ Fatto: " + (", ".join(task.title for task in tasks) or "nessuna azione")]
        lines.append("👀 Da monitorare: " + (", ".join(decision.task.title for decision in self.pending) or "nulla"))
        if self.queued_notifications:
            lines.append("🔕 Notifiche accodate: " + ", ".join(item.task.title for item in self.queued_notifications))
        return "\n".join(lines)

    def decision_message(self, decision: Decision) -> str:
        task = decision.task
        message = [f"⚠️ Serve una tua decisione: {task.title}", f"Contesto: {decision.reason}.", self.simulate_no_response(task)]
        if task.details:
            message.append(task.details)
        message.append("Opzioni:\n" + "\n".join(f"{index}. {option}" for index, option in enumerate(decision.options, 1)))
        trust_line = f"Fiducia dinamica: {decision.trust_score:.0f}/100 · {decision.trust_context}"
        if decision.dynamic_spend_limit_eur:
            trust_line += f" · limite dinamico € {decision.dynamic_spend_limit_eur:.0f}"
        if decision.trust_cap is not None:
            trust_line += f" · tetto di sicurezza {decision.trust_cap:.0f}/100"
        message.append(trust_line)
        if decision.imported_trust_proposal:
            message.append("Proposta prudenziale: sto riusando una parte della fiducia di una combinazione simile, ma non abilito l'esecuzione silenziosa.")
        if decision.routed_to:
            message.append(f"Delegata a: {decision.routed_to} (verificherò i suoi permessi prima dell'approvazione).")
        if decision.calibration_notice:
            message.append(f"Calibrazione attiva: per i primi {self.config.calibration_days} giorni potresti ricevere qualche notifica in più.")
        if task.urgent:
            message.append("Scadenza per rispondere: oggi.")
        elif decision.notification_queued:
            message.append("La richiesta resta nel digest perché hai raggiunto il limite di notifiche attive.")
        return "\n".join(message)


def load_task(path: Path) -> Task:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError("Il task deve essere un oggetto JSON")
    return Task.from_dict(data)


def main() -> None:
    parser = argparse.ArgumentParser(description="Everyday Agent")
    parser.add_argument("task", type=Path, help="file JSON con il task da elaborare")
    parser.add_argument("--config", type=Path, default=Path("agent.config.json"))
    parser.add_argument("--memory", type=Path, default=Path(".everyday-memory.json"))
    args = parser.parse_args()
    agent = EverydayAgent(AgentConfig.from_file(args.config), Memory(args.memory))
    decision = agent.process(load_task(args.task))
    if decision.level == AutonomyLevel.ASK_FIRST:
        print(agent.decision_message(decision))
    elif decision.level == AutonomyLevel.EXECUTE_AND_REPORT:
        print(agent.digest([decision.task]))
    else:
        print("Azione completata.")


if __name__ == "__main__":
    main()
