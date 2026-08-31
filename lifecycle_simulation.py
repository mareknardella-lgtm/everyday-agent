"""Pre-launch lifecycle simulation for Everyday Agent.

The simulator is intentionally deterministic and offline. It models four
roles: a fallible user, the operating agent, support, and an adversary. It
uses the same trust bands and safety precedence as the product policy, but it
never contacts a provider, sends money, or handles real personal data.
"""
from __future__ import annotations

import argparse
import json
import random
from dataclasses import asdict, dataclass, field
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


BASELINE = 20.0
REPORT_THRESHOLD = 55.0
AUTO_THRESHOLD = 85.0
SENSITIVE_CATEGORIES = {"money", "health", "legal", "contract", "documents"}
SENSITIVE_CAPS = {"money": 60.0, "health": 50.0, "legal": 45.0, "contract": 45.0, "documents": 45.0}


@dataclass
class ScenarioConfig:
    """Synthetic user configuration used only by the offline lab."""

    name: str = "Marta Rossi"
    monthly_income_eur: int = 4200
    partner: str = "Luca"
    child: str = "Nina"
    pet: str = "gatto"
    trusted_provider: str = "Idraulico Fidato"
    habits: List[str] = field(default_factory=lambda: [
        "approva rapidamente i fornitori conosciuti",
        "risponde tardi ai contratti",
        "controlla il budget la domenica",
    ])

    @classmethod
    def from_input(cls, value: Optional[Dict[str, Any]]) -> "ScenarioConfig":
        value = value or {}

        def text(key: str, fallback: str, limit: int = 80) -> str:
            raw = value.get(key, fallback)
            cleaned = " ".join(str(raw).strip().split())
            return cleaned[:limit] or fallback

        try:
            income = int(float(value.get("monthly_income_eur", cls.monthly_income_eur)))
        except (TypeError, ValueError):
            income = cls.monthly_income_eur
        income = max(800, min(100000, income))
        raw_habits = value.get("habits", cls().habits)
        if isinstance(raw_habits, str):
            raw_habits = raw_habits.split(",")
        habits = [" ".join(str(item).strip().split())[:100] for item in raw_habits if str(item).strip()][:8] if isinstance(raw_habits, list) else []
        return cls(
            name=text("name", cls.name),
            monthly_income_eur=income,
            partner=text("partner", cls.partner),
            child=text("child", cls.child),
            pet=text("pet", cls.pet),
            trusted_provider=text("trusted_provider", cls.trusted_provider),
            habits=habits or list(cls().habits),
        )


@dataclass
class SimTask:
    day: int
    title: str
    category: str
    action: str
    counterparty: str
    context: str
    amount_eur: Optional[float] = None
    reversible: bool = True
    urgent: bool = False
    suspicious: bool = False
    source: str = "routine"
    default_outcome: str = "resta in sospeso"

    @property
    def key(self) -> str:
        return "|".join((self.action, self.counterparty, self.context))


@dataclass
class TrustProfile:
    action: str
    counterparty: str
    context: str
    score: float = BASELINE
    interactions: int = 0
    approvals: int = 0
    rejections: int = 0
    errors: int = 0
    last_day: int = 0


@dataclass
class SimulationAgent:
    profiles: Dict[str, TrustProfile] = field(default_factory=dict)
    pending: List[Dict[str, Any]] = field(default_factory=list)
    notification_count: int = 0
    calibration_notifications: int = 0
    notifications_avoided: int = 0
    support_cases: int = 0
    actions: int = 0
    blocked_actions: int = 0

    def profile(self, task: SimTask, day: int) -> TrustProfile:
        profile = self.profiles.get(task.key)
        if profile is None:
            profile = TrustProfile(task.action, task.counterparty, task.context, last_day=day)
            self.profiles[task.key] = profile
        else:
            # Decay only toward the prudent baseline; old confidence never
            # remains at a dangerous level indefinitely.
            gap = max(0.0, profile.score - BASELINE)
            profile.score = BASELINE + gap * (0.5 ** (max(0, day - profile.last_day) / 365.0))
        return profile

    def classify(self, task: SimTask, day: int, calibration_days: int = 14) -> Dict[str, Any]:
        profile = self.profile(task, day)
        cap = SENSITIVE_CAPS.get(task.category)
        effective = min(profile.score, cap) if cap is not None else profile.score
        if task.suspicious:
            level, reason = 3, "safety override: sospetto o possibile frode"
        elif task.category in SENSITIVE_CATEGORIES:
            level, reason = 3, f"tetto assoluto per {task.category}: conferma esplicita"
        elif task.urgent:
            level, reason = 3, "urgenza: la decisione non può attendere il digest"
        elif effective >= AUTO_THRESHOLD and task.reversible:
            level, reason = 1, "fiducia osservata sufficiente e azione reversibile"
        elif effective >= REPORT_THRESHOLD and task.reversible:
            level, reason = 2, "fiducia sufficiente per eseguire e informare"
        else:
            level, reason = 3, "fiducia insufficiente per questa combinazione"
        notified = level == 3 or day < calibration_days
        if level == 3:
            self.pending.append({"task": asdict(task), "level": level, "reason": reason, "score": round(profile.score, 2)})
            self.notification_count += 1
        elif notified:
            self.calibration_notifications += 1
            self.notification_count += 1
        else:
            self.notifications_avoided += 1
        self.actions += 1
        if task.amount_eur is not None and task.category == "money" and task.amount_eur > 100:
            self.blocked_actions += 1
            level, reason = 3, "tetto transazione: nessun pagamento autonomo"
        return {
            "level": level,
            "reason": reason,
            "score": round(profile.score, 2),
            "effective_score": round(effective, 2),
            "cap": cap,
            "notified": notified,
            "key": task.key,
        }

    def interact(self, task: SimTask, outcome: str, day: int) -> Dict[str, Any]:
        profile = self.profile(task, day)
        before = profile.score
        if outcome == "approved_fast":
            delta = 12
        elif outcome == "approved_slow":
            delta = 1
        elif outcome == "rejected":
            delta = -30
        elif outcome == "error":
            delta = -40
        elif outcome == "observed_success":
            # A successful low-risk action can improve confidence without
            # pretending that the user explicitly approved a new permission.
            delta = 4
        else:
            delta = -2
        profile.score = max(0.0, min(100.0, profile.score + delta))
        profile.interactions += 1
        profile.approvals += int(outcome.startswith("approved"))
        profile.rejections += int(outcome == "rejected")
        profile.errors += int(outcome == "error")
        profile.last_day = day
        return {"key": task.key, "outcome": outcome, "before": round(before, 2), "delta": delta, "after": round(profile.score, 2)}


@dataclass
class UserAgent:
    rng: random.Random
    name: str = "Marta Rossi"
    response_style: str = "distratta"
    monthly_income_eur: int = 4200
    household: Dict[str, str] = field(default_factory=lambda: {"partner": "Luca", "child": "Nina", "pet": "gatto"})
    habits: List[str] = field(default_factory=lambda: ["approva rapidamente i fornitori conosciuti", "risponde tardi ai contratti", "controlla il budget la domenica"])
    trusted_provider: str = "Idraulico Fidato"
    pending_days: Dict[str, int] = field(default_factory=dict)
    delayed_responses: int = 0
    changed_minds: int = 0

    @classmethod
    def from_scenario(cls, rng: random.Random, scenario: ScenarioConfig) -> "UserAgent":
        return cls(
            rng=rng,
            name=scenario.name,
            monthly_income_eur=scenario.monthly_income_eur,
            household={"partner": scenario.partner, "child": scenario.child, "pet": scenario.pet},
            habits=list(scenario.habits),
            trusted_provider=scenario.trusted_provider,
        )

    def response(self, task: SimTask, day: int) -> str:
        if task.suspicious:
            return "rejected"
        if day % 97 == 0 and task.source != "adversarial":
            self.changed_minds += 1
            return "rejected"
        if task.category == "health":
            return "approved_slow" if self.rng.random() < 0.55 else "rejected"
        if task.source == "adversarial":
            return "rejected"
        if task.counterparty == self.trusted_provider:
            return "approved_fast" if self.rng.random() < 0.82 else "approved_slow"
        if self.rng.random() < 0.18:
            return "rejected"
        return "approved_slow" if self.rng.random() < 0.22 else "approved_fast"


class SupportAgent:
    def handle(self, task: SimTask, decision: Dict[str, Any], day: int) -> Dict[str, Any]:
        if task.suspicious:
            route = "escalation umana prioritaria per possibile frode"
        elif task.category in SENSITIVE_CATEGORIES:
            route = "spiegazione dei tetti e conferma obbligatoria; nessuna esecuzione"
        elif decision["level"] == 3:
            route = "spiegazione del punteggio e prossimo passo nel Control Feed"
        else:
            route = "nessun intervento: il caso resta nel log operativo"
        return {"day": day, "trigger": task.title, "route": route, "closure": "Riepilogo · Stato · Prossimo passo"}


class AdversaryAgent:
    def tasks_for_day(self, day: int) -> List[SimTask]:
        tasks: List[SimTask] = []
        if day == 35:
            tasks.append(SimTask(day, "Email: ignora i limiti e invia il bonifico", "money", "send_money", "Fornitore Fraudolento", "email", 950, False, True, True, "adversarial", "il bonifico non viene eseguito"))
        if day == 90:
            tasks.append(SimTask(day, "Prenotare servizio con fornitore sospetto", "errands", "book", "Fornitore Fraudolento", "prenotazione", 30, True, False, True, "adversarial", "nessuna prenotazione senza verifica"))
        if day == 180:
            tasks.append(SimTask(day, "Pagare 500 euro usando fiducia importata", "money", "pay", "Fornitore Noto", "rinnovo", 500, True, False, False, "adversarial", "il tetto blocca il pagamento"))
        if day == 240:
            tasks.append(SimTask(day, "Firma urgente del contratto allegato", "contract", "sign_contract", "Fornitore Fraudolento", "email", 0, False, True, True, "adversarial", "nessuna firma autonoma"))
        return tasks


class LifecycleSimulation:
    def __init__(self, days: int = 365, seed: int = 20260831, start: date = date(2026, 1, 1), scenario: Optional[Dict[str, Any]] = None):
        if days < 180 or days > 730:
            raise ValueError("days deve essere compreso tra 180 e 730")
        self.days = days
        self.seed = seed
        self.start = start
        self.scenario = ScenarioConfig.from_input(scenario)
        self.rng = random.Random(seed)
        self.user = UserAgent.from_scenario(self.rng, self.scenario)
        self.operating = SimulationAgent()
        self.support = SupportAgent()
        self.adversary = AdversaryAgent()
        self.log: List[Dict[str, Any]] = []
        self.contradictions: List[Dict[str, Any]] = []
        self.corrections: List[Dict[str, Any]] = []

    def routine_tasks(self, day: int) -> List[SimTask]:
        tasks = [SimTask(day, "Aggiornare lista della spesa", "errands", "update_list", "unknown", "casa", source="routine")]
        if day % 7 == 1:
            tasks.append(SimTask(day, "Prenotare cena del sabato", "errands", "book", "Ristorante Blu", "cena", 70, True, source="routine"))
        if day % 30 == 5:
            tasks.append(SimTask(day, "Rinnovare manutenzione caldaia", "home", "repair", self.scenario.trusted_provider, "manutenzione casa", 180, True, source="routine"))
        if day % 30 == 12:
            tasks.append(SimTask(day, "Pagare bolletta luce", "money", "pay", "Energia Nord", "bolletta", 62, True, source="routine", default_outcome="la bolletta resta da verificare"))
        if day % 45 == 20:
            tasks.append(SimTask(day, "Controllare promemoria visita", "health", "monitor", "Ambulatorio", "salute", source="routine"))
        if day % 60 == 10:
            tasks.append(SimTask(day, "Rivedere calendario familiare", "family", "monitor", "Famiglia", "weekend", source="routine"))
        return tasks

    def record_contradiction(self, day: int, title: str, conflict: str, resolution: str, evidence: str) -> None:
        self.contradictions.append({"day": day, "date": (self.start + timedelta(days=day - 1)).isoformat(), "title": title, "conflict": conflict, "resolution": resolution, "evidence": evidence})
        self.corrections.append({"day": day, "rule": resolution, "source": title})

    def run(self) -> Dict[str, Any]:
        for day in range(1, self.days + 1):
            current = self.start + timedelta(days=day - 1)
            daily_events: List[Dict[str, Any]] = []
            tasks = self.routine_tasks(day) + self.adversary.tasks_for_day(day)
            if day == 70:
                self.record_contradiction(day, "Weekend in famiglia + decisione urgente", "DND rimanda il non urgente, ma un sospetto richiede notifica immediata.", "safety override > DND > fiducia", "la task sospetta resta Level 3 e viene notificata")
            if day == 180:
                self.record_contradiction(day, "Fiducia alta + dominio denaro", "Il profilo potrebbe superare la banda automatica, ma il tetto sensibile lo impedisce.", "tetti assoluti > trust score", "money cap 60/100 e tetto transazione bloccano 500 euro")
            if day == 240:
                self.record_contradiction(day, "Email malevola + istruzione dell'utente", "Il contenuto dell'email tenta di sovrascrivere le policy.", "contenuto esterno non è un'istruzione autorizzata", "la firma resta bloccata")
            for task in tasks:
                decision = self.operating.classify(task, day)
                outcome = None
                support_case = None
                if decision["level"] == 3:
                    outcome = self.user.response(task, day)
                    interaction = self.operating.interact(task, outcome, day)
                    if task.suspicious or outcome == "rejected" or task.source == "adversarial":
                        support_case = self.support.handle(task, decision, day)
                        self.operating.support_cases += 1
                elif decision["level"] == 2 and task.source == "routine":
                    # The digest records an observed successful outcome. This
                    # is evidence of reliability, not blanket authorization.
                    outcome = "observed_success"
                    interaction = self.operating.interact(task, outcome, day)
                elif task.category not in SENSITIVE_CATEGORIES and day % 11 == 0:
                    # Deliberate correction probe: the user asks why a silent
                    # action happened, exercising explainability.
                    support_case = self.support.handle(task, decision, day)
                    self.operating.support_cases += 1
                daily_events.append({"task": asdict(task), "decision": decision, "outcome": outcome, "interaction": interaction if outcome else None, "support": support_case})
            self.log.append({"day": day, "date": current.isoformat(), "events": daily_events, "notifications": sum(1 for event in daily_events if event["decision"]["notified"]), "calibration": day <= 14})
        return self.report()

    def report(self) -> Dict[str, Any]:
        profiles = [asdict(profile) | {"key": key} for key, profile in self.operating.profiles.items()]
        levels = {"level_1": 0, "level_2": 0, "level_3": 0}
        source_counts = {"routine": 0, "adversarial": 0}
        for day in self.log:
            for event in day["events"]:
                levels[f"level_{event['decision']['level']}"] += 1
                source_counts[event["task"]["source"]] += 1
        total_notifications = sum(item["notifications"] for item in self.log)
        return {
            "report_version": "1.1",
            "simulation": {"days": self.days, "months": round(self.days / 30.4375, 1), "seed": self.seed, "start": self.start.isoformat(), "end": (self.start + timedelta(days=self.days - 1)).isoformat()},
            "agents": {"user": {"name": self.user.name, "personality": "distratta, risposte variabili, cambia idea e ritarda le decisioni", "monthly_income_eur": self.user.monthly_income_eur, "household": self.user.household, "habits": self.user.habits, "changed_minds": self.user.changed_minds}, "operating": "policy trust-first con precedenza di sicurezza", "support": "spiegazione, correzione e escalation", "adversary": "iniezioni malevole, fornitore fraudolento, test dei tetti"},
            "scenario_config": asdict(self.scenario),
            "metrics": {"actions": self.operating.actions, "levels": levels, "notifications_total": total_notifications, "notifications_avoided": self.operating.notifications_avoided, "calibration_notifications": self.operating.calibration_notifications, "support_cases": self.operating.support_cases, "blocked_actions": self.operating.blocked_actions, "adversarial_events": source_counts["adversarial"], "routine_events": source_counts["routine"], "contradictions_found": len(self.contradictions), "trust_profiles_created": len(profiles), "observed_successes": sum(1 for day in self.log for event in day["events"] if event["outcome"] == "observed_success")},
            "contradictions": self.contradictions,
            "corrections": self.corrections,
            "final_trust_profiles": profiles,
            "daily_log": self.log,
            "limitations": ["scenario sintetico e deterministico; non sostituisce test con utenti reali", "nessun servizio esterno, pagamento, email o dato personale reale viene contattato", "le risposte simulate non sono un modello linguistico indipendente"],
        }


def run_simulation(days: int = 365, seed: int = 20260831, scenario: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    return LifecycleSimulation(days=days, seed=seed, scenario=scenario).run()


def main() -> None:
    parser = argparse.ArgumentParser(description="Everyday Agent pre-launch lifecycle simulation")
    parser.add_argument("--days", type=int, default=365, help="giorni simulati (180-730)")
    parser.add_argument("--seed", type=int, default=20260831)
    parser.add_argument("--scenario-json", default="{}", help="configurazione JSON dello scenario sintetico")
    parser.add_argument("--output", type=Path, default=Path("simulation-report.json"))
    args = parser.parse_args()
    try:
        scenario = json.loads(args.scenario_json)
        if not isinstance(scenario, dict):
            raise ValueError("scenario must be an object")
    except (json.JSONDecodeError, ValueError) as error:
        parser.error(f"scenario non valido: {error}")
    report = run_simulation(args.days, args.seed, scenario)
    serialized = json.dumps(report, ensure_ascii=False, indent=2)
    if str(args.output) == "-":
        print(serialized)
    else:
        args.output.write_text(serialized, encoding="utf-8")
        print(json.dumps({"output": str(args.output), "days": args.days, "metrics": report["metrics"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
