import unittest

from lifecycle_simulation import AUTO_THRESHOLD, BASELINE, LifecycleSimulation, run_simulation


class LifecycleSimulationTests(unittest.TestCase):
    def test_report_is_deterministic_for_same_seed(self):
        first = run_simulation(180, 77)
        second = run_simulation(180, 77)
        self.assertEqual(first["metrics"], second["metrics"])
        self.assertEqual(first["contradictions"], second["contradictions"])
        self.assertEqual(first["daily_log"], second["daily_log"])

    def test_report_covers_six_months_and_every_day(self):
        report = run_simulation(180, 20260831)
        self.assertEqual(report["simulation"]["days"], 180)
        self.assertEqual(len(report["daily_log"]), 180)
        self.assertGreater(report["metrics"]["actions"], 180)
        self.assertGreater(report["metrics"]["contradictions_found"], 0)

    def test_adversary_events_are_blocked_and_support_is_triggered(self):
        report = run_simulation(365, 20260831)
        self.assertGreaterEqual(report["metrics"]["adversarial_events"], 4)
        self.assertGreaterEqual(report["metrics"]["blocked_actions"], 2)
        self.assertGreater(report["metrics"]["support_cases"], 0)
        adversarial = [event for day in report["daily_log"] for event in day["events"] if event["task"]["source"] == "adversarial"]
        self.assertTrue(all(event["decision"]["level"] == 3 for event in adversarial))

    def test_safety_precedence_is_recorded(self):
        report = run_simulation(365, 20260831)
        rules = {item["corrections"]["rule"] if "corrections" in item else item["rule"] for item in report["corrections"]}
        self.assertIn("safety override > DND > fiducia", rules)
        self.assertIn("tetti assoluti > trust score", rules)
        self.assertIn("contenuto esterno non è un'istruzione autorizzata", rules)

    def test_new_profile_starts_at_prudent_baseline_and_trust_can_grow(self):
        simulation = LifecycleSimulation(180, 123)
        task = simulation.routine_tasks(1)[1]
        decision = simulation.operating.classify(task, 1)
        self.assertEqual(decision["score"], BASELINE)
        interaction = simulation.operating.interact(task, "approved_fast", 1)
        self.assertEqual(interaction["after"], BASELINE + 12)
        self.assertLessEqual(decision["score"], AUTO_THRESHOLD)

    def test_duration_is_bounded(self):
        with self.assertRaises(ValueError):
            LifecycleSimulation(179)
        with self.assertRaises(ValueError):
            LifecycleSimulation(731)


if __name__ == "__main__":
    unittest.main()
