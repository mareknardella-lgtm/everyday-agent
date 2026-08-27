import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from everyday_agent import AgentConfig, AutonomyLevel, EverydayAgent, Memory, Task


class EverydayAgentTests(unittest.TestCase):
    def make_agent(self, config=None):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        return EverydayAgent(config or AgentConfig(), Memory(Path(directory.name) / "memory.json"))

    def test_preapproved_reversible_task_is_silent(self):
        agent = self.make_agent()
        decision = agent.process(Task("Riordinare detersivo", preapproved=True))
        self.assertEqual(decision.level, AutonomyLevel.EXECUTE_SILENTLY)
        self.assertEqual(len(agent.pending), 0)

    def test_low_risk_task_is_reported(self):
        agent = self.make_agent()
        decision = agent.process(Task("Aggiornare lista della spesa"))
        self.assertEqual(decision.level, AutonomyLevel.EXECUTE_AND_REPORT)
        self.assertIn("Aggiornare lista della spesa", agent.digest())

    def test_sensitive_task_requires_confirmation(self):
        agent = self.make_agent()
        decision = agent.process(Task("Pagare bolletta", category="money", amount_eur=20))
        self.assertEqual(decision.level, AutonomyLevel.ASK_FIRST)
        self.assertTrue(decision.active_notification)
        self.assertTrue(agent.approve("pagare BOLLETTA"))

    def test_threshold_requires_confirmation(self):
        agent = self.make_agent(AgentConfig(spending_threshold_eur=50))
        decision = agent.process(Task("Acquistare elettrodomestico", amount_eur=100))
        self.assertEqual(decision.level, AutonomyLevel.ASK_FIRST)

    def test_sensitive_domain_always_requires_explicit_confirmation(self):
        agent = self.make_agent()
        decision = agent.process(Task("Archiviare dati sanitari", category="health", preapproved=True))
        self.assertEqual(decision.level, AutonomyLevel.ASK_FIRST)
        self.assertIn("autorizzazione esplicita", decision.reason)

    def test_professional_advice_is_not_given_as_binding_advice(self):
        agent = self.make_agent()
        decision = agent.process(Task("Consigliami il dosaggio del farmaco"))
        self.assertEqual(decision.level, AutonomyLevel.ASK_FIRST)
        self.assertIn("professionista", decision.reason)

    def test_irreversible_action_requires_confirmation(self):
        agent = self.make_agent()
        decision = agent.process(Task("Cancellare appuntamento", action="cancel"))
        self.assertEqual(decision.level, AutonomyLevel.ASK_FIRST)

    def test_suspicious_activity_is_immediate(self):
        agent = self.make_agent(AgentConfig(max_active_notifications_per_day=0))
        decision = agent.process(Task("Pagamento sospetto", category="money"))
        self.assertEqual(decision.level, AutonomyLevel.ASK_FIRST)
        self.assertTrue(decision.active_notification)

    def test_rejection_is_not_forgotten(self):
        agent = self.make_agent()
        agent.process(Task("Eliminare documento", action="delete"))
        self.assertTrue(agent.reject("Eliminare documento"))
        decision = agent.process(Task("Eliminare documento", action="delete"))
        self.assertEqual(decision.level, AutonomyLevel.ASK_FIRST)
        self.assertIn("rifiutato", decision.reason)

    def test_never_automate_and_rejection_are_remembered(self):
        agent = self.make_agent(AgentConfig(never_automate=["contratto"]))
        decision = agent.process(Task("Rinnovare contratto", category="contract"))
        self.assertEqual(decision.level, AutonomyLevel.ASK_FIRST)
        self.assertTrue(agent.reject("Rinnovare contratto"))
        repeated = agent.process(Task("Rinnovare contratto", category="contract"))
        self.assertEqual(repeated.level, AutonomyLevel.ASK_FIRST)

    def test_custom_options_are_in_decision_message(self):
        agent = self.make_agent()
        decision = agent.process(Task("Scegliere preventivo", reversible=False, options=["80 euro", "340 euro"]))
        message = agent.decision_message(decision)
        self.assertIn("1. 80 euro", message)
        self.assertIn("2. 340 euro", message)

    def test_notification_limit_queues_nonurgent_decisions(self):
        agent = self.make_agent(AgentConfig(max_active_notifications_per_day=1))
        first = agent.process(Task("Prima scelta", reversible=False))
        second = agent.process(Task("Seconda scelta", reversible=False))
        self.assertTrue(first.active_notification)
        self.assertTrue(second.notification_queued)
        self.assertIn("Seconda scelta", agent.digest())

    def test_digest_reports_pending_tasks(self):
        agent = self.make_agent()
        agent.process(Task("Scegliere preventivo", reversible=False))
        self.assertIn("Scegliere preventivo", agent.digest())

    def test_ambiguous_task_requires_level_three(self):
        agent = self.make_agent()
        decision = agent.process(Task("Consigliami, scegli tu il preventivo"))
        self.assertEqual(decision.level, AutonomyLevel.ASK_FIRST)
        self.assertIn("ambigua", decision.reason)

    def test_levels_one_two_three_match_operating_model(self):
        agent = self.make_agent()
        self.assertEqual(agent.process(Task("Riordinare lista", preapproved=True)).level, AutonomyLevel.EXECUTE_SILENTLY)
        self.assertEqual(agent.process(Task("Aggiornare promemoria")).level, AutonomyLevel.EXECUTE_AND_REPORT)
        self.assertEqual(agent.process(Task("Scegliere tra due opzioni", reversible=False)).level, AutonomyLevel.ASK_FIRST)

    def test_default_outcome_is_in_decision_message(self):
        agent = self.make_agent()
        task = Task("Rinnovo contratto", category="contract", default_outcome="si rinnova alle condizioni attuali")
        message = agent.decision_message(agent.process(task))
        self.assertIn("Se non rispondi: si rinnova alle condizioni attuali", message)

    def test_silent_cost_and_hidden_deadline_are_recorded(self):
        agent = self.make_agent()
        costs = agent.analyze_silent_cost([{"name": "Palestra", "unused_days": 100}, {"name": "Streaming", "unused_days": 5, "duplicate_with": "Altro streaming"}])
        self.assertEqual(len(costs), 2)
        deadlines = agent.scan_hidden_deadlines([{"name": "Garanzia", "days_remaining": 14}, {"name": "Ferie", "days_remaining": 90}])
        self.assertEqual(len(deadlines), 1)
        self.assertIn("Palestra", agent.monthly_digest())

    def test_smart_dnd_and_routing(self):
        agent = self.make_agent(AgentConfig(dnd_contexts=["viaggio"]))
        self.assertTrue(agent.assess_context("Sono in viaggio")["active"])
        decision = agent.process(Task("Vaccino figlio", category="health", recipient="partner"))
        self.assertEqual(decision.routed_to, "partner")

    def test_calibration_is_explicit_and_temporary(self):
        agent = self.make_agent(AgentConfig(calibration_days=14, calibration_extra_notifications=2))
        status = agent.calibration_status()
        self.assertTrue(status["active"])
        self.assertIn("calibrando", status["notice"])
        self.assertGreaterEqual(status["days_remaining"], 1)

    def test_level_one_has_explanation_and_local_undo_redo(self):
        agent = self.make_agent()
        task = Task("Riordinare lista", preapproved=True)
        agent.process(task)
        self.assertIn("Livello 1", agent.explain(task))
        self.assertIn("regola", agent.explain(task).casefold())
        self.assertTrue(agent.undo(task.title))
        self.assertTrue(agent.redo(task.title))

    def test_permanent_sensitive_authorization_never_reaches_level_one(self):
        agent = self.make_agent()
        decision = agent.process(Task("Pagare abbonamento", category="money", preapproved=True, permanent_authorization=True))
        self.assertEqual(decision.level, AutonomyLevel.EXECUTE_AND_REPORT)

    def test_family_permission_matrix_blocks_unauthorized_actor(self):
        config = AgentConfig(family_permissions={"owner": {"*": ["approve"]}, "partner": {"health": ["approve"]}, "teen": {"errands": ["approve"]}})
        agent = self.make_agent(config)
        agent.process(Task("Pagare spesa", category="money"))
        self.assertFalse(agent.approve("Pagare spesa", actor="teen"))
        self.assertTrue(agent.approve("Pagare spesa", actor="owner"))

    def test_technical_failure_is_separate_and_resolvable(self):
        agent = self.make_agent()
        failure = agent.record_integration_failure("calendario", "Token scaduto", priority="low")
        self.assertEqual(failure["status"], "open")
        self.assertIn("calendario", agent.technical_digest())
        self.assertTrue(agent.resolve_integration_failure(failure["id"]))
        self.assertEqual(agent.technical_issues(), [])

    def test_gdpr_sharing_requires_case_by_case_authorization(self):
        agent = self.make_agent(AgentConfig(data_retention_days=30, legal_basis="consent"))
        self.assertFalse(agent.share_data("health", "farmacia", "promemoria"))
        self.assertTrue(agent.share_data("health", "farmacia", "promemoria", authorized=True))
        summary = agent.privacy_summary()
        self.assertEqual(summary["retention_days"], 30)
        self.assertIn("delete", summary["rights"])
        self.assertIn("privacy", agent.export_personal_data())

    def test_metrics_and_seasonal_forecast_are_actionable(self):
        agent = self.make_agent(AgentConfig(seasonal_periods=[{"name": "Dichiarazione", "month": 5, "day": 31, "lead_days": 45}]))
        agent.process(Task("Aggiornare promemoria"))
        agent.process(Task("Scegliere preventivo", reversible=False))
        self.assertTrue(agent.approve("Scegliere preventivo"))
        agent.record_deescalation("Scegliere preventivo")
        self.assertGreaterEqual(agent.metrics()["notifications_avoided"], 1)
        self.assertGreater(agent.metrics()["deescalation_rate"], 0)
        upcoming = agent.upcoming_seasonal_periods(datetime(2026, 4, 20, tzinfo=timezone.utc), horizon_days=45)
        self.assertEqual(upcoming[0]["name"], "Dichiarazione")

    def test_offboarding_preserves_handover_and_pauses_agent(self):
        agent = self.make_agent()
        agent.process(Task("Scegliere preventivo", reversible=False))
        package = agent.offboard(delegate="partner")
        self.assertEqual(package["delegate"], "partner")
        self.assertEqual(package["pending"][0]["task"]["title"], "Scegliere preventivo")
        self.assertTrue(agent.paused)
        self.assertIn("pausa", agent.classify(Task("Aggiornare lista")).reason)

    def test_family_context_and_retention_are_persisted(self):
        agent = self.make_agent()
        agent.memory.remember_family_member("Alex", "figlio", ["vaccino annuale"])
        agent.memory.remember_pattern("renewal", "approva sotto 50 euro")
        self.assertEqual(agent.memory.data["family_context"]["Alex"]["role"], "figlio")
        self.assertEqual(agent.memory.data["observed_patterns"][0]["key"], "renewal")

    def test_rejection_can_be_reconsidered_with_new_elements(self):
        agent = self.make_agent()
        agent.process(Task("Cambiare fornitore", reversible=False))
        self.assertTrue(agent.reject("Cambiare fornitore"))
        decision = agent.process(Task("Cambiare fornitore", reversible=False, new_elements="nuovo preventivo verificato"))
        self.assertNotIn("rifiutato", decision.reason)

    def test_nonreversible_action_cannot_be_rolled_back(self):
        agent = self.make_agent()
        agent.process(Task("Inviare bonifico", action="send_money", reversible=False))
        self.assertTrue(agent.approve("Inviare bonifico"))
        self.assertFalse(agent.undo("Inviare bonifico"))

    def test_repeated_approvals_propose_automation(self):
        agent = self.make_agent()
        for _ in range(3):
            agent.process(Task("Rinnovare filtro", reversible=False))
            self.assertTrue(agent.approve("Rinnovare filtro"))
        self.assertEqual(agent.last_automation_suggestion, "Rinnovare filtro")
        self.assertIn("Rinnovare filtro", agent.memory.data["automation_suggestions"])

    def test_new_counterparty_starts_at_twenty_and_requires_confirmation(self):
        agent = self.make_agent()
        decision = agent.process(Task("Riparare perdita", action="repair", counterparty="Fornitore Nuovo", context="manutenzione casa", amount_eur=30))
        self.assertEqual(decision.trust_score, 20.0)
        self.assertEqual(decision.level, AutonomyLevel.ASK_FIRST)
        self.assertIn("fiducia insufficiente", decision.reason)

    def test_trusted_counterparty_gets_dynamic_spend_limit(self):
        agent = self.make_agent()
        agent.set_trust_score("repair", "Idraulico Fidato", "manutenzione casa", 92)
        decision = agent.process(Task("Riparare perdita", action="repair", counterparty="Idraulico Fidato", context="manutenzione casa", amount_eur=300))
        self.assertEqual(decision.level, AutonomyLevel.EXECUTE_SILENTLY)
        self.assertEqual(decision.trust_score, 92.0)
        self.assertEqual(decision.dynamic_spend_limit_eur, 400.0)

    def test_fast_approval_raises_more_than_slow_approval_and_rejection_drops(self):
        fast = self.make_agent()
        task = Task("Prenotare ristorante", action="book", counterparty="Ristorante Blu", context="cena")
        fast.record_trust_interaction(task, "approved", response_time_seconds=60)
        self.assertEqual(fast.trust_score("book", "Ristorante Blu", "cena"), 32.0)
        slow = self.make_agent()
        slow.record_trust_interaction(task, "approved", response_time_seconds=172800)
        self.assertEqual(slow.trust_score("book", "Ristorante Blu", "cena"), 21.0)
        slow.record_trust_interaction(task, "rejected")
        self.assertEqual(slow.trust_score("book", "Ristorante Blu", "cena"), 0.0)

    def test_trust_decays_toward_prudent_baseline(self):
        agent = self.make_agent()
        agent.set_trust_score("repair", "Idraulico Fidato", "casa", 92)
        future = datetime.now(timezone.utc) + timedelta(days=365)
        profile = agent.trust_engine.profile("repair", "Idraulico Fidato", "casa", now=future)
        self.assertLess(profile["score"], 60)
        self.assertGreater(profile["score"], 20)

    def test_similar_trust_is_imported_but_never_silent(self):
        agent = self.make_agent()
        agent.set_trust_score("book", "Ristorante Blu", "cena", 92)
        decision = agent.process(Task("Prenotare treno", action="book", counterparty="Rail Blu", context="viaggio", category="errands"))
        self.assertEqual(decision.trust_source, "imported")
        self.assertTrue(decision.imported_trust_proposal)
        self.assertEqual(decision.level, AutonomyLevel.ASK_FIRST)

    def test_sensitive_trust_cap_cannot_reach_silent_execution(self):
        agent = self.make_agent()
        agent.set_trust_score("pay", "Idraulico Fidato", "bolletta", 100)
        decision = agent.process(Task("Pagare bolletta", action="pay", category="money", counterparty="Idraulico Fidato", context="bolletta", amount_eur=20))
        self.assertEqual(decision.trust_cap, 60.0)
        self.assertNotEqual(decision.level, AutonomyLevel.EXECUTE_SILENTLY)

    def test_domain_consent_is_specific_renewable_and_revocable(self):
        agent = self.make_agent(AgentConfig(autonomy_consent_renewal_days=30))
        self.assertFalse(agent.has_domain_consent("money"))
        consent = agent.grant_domain_consent("money")
        self.assertTrue(agent.has_domain_consent("money"))
        self.assertEqual(consent["domain"], "money")
        self.assertFalse(agent.has_domain_consent("health"))
        agent.revoke_domain_consent("money")
        self.assertFalse(agent.has_domain_consent("money"))

    def test_money_guard_enforces_single_monthly_and_demo_caps(self):
        config = AgentConfig(autonomous_money_enabled=True, money_single_transaction_cap_eur=100, money_monthly_cap_eur=150)
        agent = self.make_agent(config)
        agent.grant_domain_consent("money")
        self.assertFalse(agent.money_guard(101)["allowed"])
        self.assertTrue(agent.record_money_spend(100, "prima", at="2026-08-10T10:00:00+00:00")["recorded"])
        self.assertFalse(agent.money_guard(60, "2026-08")["allowed"])
        blocked = agent.record_money_spend(60, "seconda", autonomous=True, at="2026-08-11T10:00:00+00:00")
        self.assertFalse(blocked["recorded"])
        self.assertIn("oltre il tetto cumulativo mensile", blocked["blocked_reasons"])

    def test_manual_mode_blocks_classification_and_has_global_override(self):
        agent = self.make_agent()
        self.assertTrue(agent.set_manual_mode(True))
        self.assertIn("modalità manuale", agent.process(Task("Aggiornare lista")).reason)
        self.assertTrue(agent.stop_and_ask_always())
        self.assertTrue(agent.memory.data["manual_mode"])

    def test_audit_chain_detects_tampering_and_crisis_is_localized(self):
        agent = self.make_agent()
        task = Task("Riparare perdita", action="repair", counterparty="Fornitore", context="casa")
        agent.record_trust_interaction(task, "approved", response_time_seconds=60)
        before = agent.trust_score("repair", "Fornitore", "casa")
        event = agent.record_execution_error(task, "risultato inatteso", domain="home")
        self.assertLess(event["trust_after"], before)
        self.assertEqual(agent.crisis_report()["open_errors"][0]["id"], event["id"])
        self.assertTrue(agent.memory.verify_audit_log()["valid"])
        agent.memory.data["audit_log"][0]["event"] = {"tampered": True}
        self.assertFalse(agent.memory.verify_audit_log()["valid"])

    def test_historical_import_requires_consent_and_advances_cold_start(self):
        agent = self.make_agent()
        records = [{"action_type": "book", "counterparty": "Ristorante", "context": "cena", "outcome": "approved", "response_time_seconds": 60}]
        self.assertTrue(agent.import_historical_data(records)["requires_consent"])
        result = agent.import_historical_data(records, authorized=True)
        self.assertEqual(result["imported"], 1)
        self.assertEqual(agent.cold_start_status()["phase"], "calibration")

    def test_business_and_dependency_summaries_are_operational(self):
        agent = self.make_agent()
        agent.process(Task("Aggiornare lista"))
        summary = agent.business_summary()
        self.assertIn("base", summary["plans"])
        self.assertEqual(summary["metrics"]["actions_executed"], 1)
        dependency = agent.dependency_check({"missed_summaries": True})
        self.assertTrue(dependency["vulnerable"])
        self.assertTrue(dependency["increase_digest"])


if __name__ == "__main__":
    unittest.main()
