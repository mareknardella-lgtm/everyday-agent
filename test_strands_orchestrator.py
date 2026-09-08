import os
import unittest
from unittest.mock import patch

from everyday_agent import AgentConfig, EverydayAgent, Memory
from strands_orchestrator import HermesStrandsOrchestrator, STRANDS_AVAILABLE, StrandsTraceRecorder


class StrandsOrchestratorTests(unittest.TestCase):
    def make_orchestrator(self):
        return HermesStrandsOrchestrator(EverydayAgent(AgentConfig(), Memory()))

    def test_plan_runs_without_sdk_and_keeps_policy_authoritative(self):
        result = self.make_orchestrator().plan(
            "Prenota una riparazione con un idraulico nuovo per 30 euro"
        )

        self.assertFalse(result["externalAction"])
        self.assertEqual(result["trust"]["score"], 20.0)
        self.assertEqual(result["decision"]["level"], 3)
        self.assertTrue(result["decision"]["requiresHumanConfirmation"])
        self.assertEqual(result["trace"][-1]["externalAction"], False)
        self.assertEqual(result["task"]["amount_eur"], 30.0)
        self.assertEqual(result["mode"], "deterministic-preflight")

    def test_sensitive_request_remains_blocked_even_with_high_trust(self):
        orchestrator = self.make_orchestrator()
        orchestrator.agent.set_trust_score("pay", "enel", "money", 100)
        result = orchestrator.plan("Paga la bolletta Enel di 20 euro")

        self.assertEqual(result["decision"]["level"], 3)
        self.assertEqual(result["trust"]["cap"], 60.0)
        self.assertFalse(result["externalAction"])

    def test_tool_catalog_is_guarded_and_status_is_explicit(self):
        orchestrator = self.make_orchestrator()
        catalog = orchestrator.tool_catalog()
        status = orchestrator.status()

        self.assertEqual(
            catalog,
            [
                "normalize_request",
                "lookup_trust",
                "apply_policy",
                "explain_decision",
                "prepare_local_action",
            ],
        )
        self.assertEqual(status["toolCatalog"], catalog)
        self.assertIn(status["state"], {"ready", "provider-unavailable", "sdk-unavailable"})
        self.assertFalse(status["externalActions"])
        self.assertNotIn("AWS_SECRET_ACCESS_KEY", str(status))

    def test_provider_status_is_explicit_and_secret_free(self):
        orchestrator = self.make_orchestrator()
        with patch.dict(os.environ, {"HERMES_STRANDS_PROVIDER": "unsupported"}, clear=False):
            status = orchestrator.provider_status()
        self.assertFalse(status["ready"])
        self.assertEqual(status["state"], "sdk-unavailable" if not STRANDS_AVAILABLE else "provider-unavailable")
        self.assertIn("reason", status)
        self.assertNotIn("secret", json_safe(status).casefold())

    @unittest.skipIf(STRANDS_AVAILABLE, "the no-SDK branch is not applicable when the optional SDK is installed")
    def test_invoke_returns_explicit_unavailable_state(self):
        result = self.make_orchestrator().invoke("Aggiorna la lista della spesa")

        self.assertEqual(result["source"], "sdk-unavailable")
        self.assertEqual(result["mode"], "sdk-unavailable")
        self.assertFalse(result["externalAction"])
        self.assertEqual(result["toolCalls"], [])
        self.assertIn("fallbackReason", result)

    def test_callback_recorder_keeps_only_tool_lifecycle(self):
        recorder = StrandsTraceRecorder()
        recorder(init_event_loop=True, data="sensitive model text")
        recorder(current_tool_use={"name": "lookup_trust", "input": {"email": "private@example.test"}})
        recorder.tool_started("lookup_trust")
        recorder.tool_finished("lookup_trust")
        recorder(result={"message": "sensitive completion"})

        self.assertEqual(recorder.tool_calls[0], {"name": "lookup_trust", "status": "completed"})
        serialized = json_safe({"events": recorder.events, "calls": recorder.tool_calls})
        self.assertNotIn("private@example.test", serialized)
        self.assertNotIn("sensitive model text", serialized)
        self.assertIn("lookup_trust", serialized)


def json_safe(value):
    import json
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


if __name__ == "__main__":
    unittest.main()
