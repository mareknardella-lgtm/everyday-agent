# Everyday Agent — Testing Instructions

## Overview

Everyday Agent includes **automated tests** (Python) and **manual verification steps** (browser UI). All tests run locally with no external dependencies or API keys.

---

## 1. Automated Tests (Python)

### Prerequisites

- Python 3.8+ installed
- No pip packages required (standard library only)

### Run All Tests

```bash
py -3 -m unittest -v
```

Or on macOS/Linux:

```bash
python3 -m unittest -v
```

### Expected Output

```
Ran 53 tests in ~1.7s
OK
```

All 53 tests must pass with zero failures.

### What the Tests Cover

#### `test_everyday_agent.py` — Core Policy Engine (46 tests)

| Category | Tests | What it verifies |
|---|---|---|
| **3-Level Operating Model** | `test_levels_one_two_three_match_operating_model` | Level 1 = execute silently, Level 2 = execute + report, Level 3 = ask first |
| **Dynamic Trust Engine** | `test_new_counterparty_starts_at_twenty_and_requires_confirmation` | New provider starts at trust 20/100, requires confirmation |
| | `test_fast_approval_raises_more_than_slow_approval_and_rejection_drops` | Quick approval raises trust more; rejection drops trust sharply |
| | `test_trust_decays_toward_prudent_baseline` | Unused trust decays over time toward baseline |
| | `test_trusted_counterparty_gets_dynamic_spend_limit` | High trust unlocks higher spend limits dynamically |
| | `test_similar_trust_is_imported_but_never_silent` | Trust transfers cautiously between similar domains, never to Level 1 |
| **Safety Caps** | `test_sensitive_trust_cap_cannot_reach_silent_execution` | Money/health/legal never reach silent execution even at trust 100 |
| | `test_permanent_sensitive_authorization_never_reaches_level_one` | Permanent authorization on sensitive tasks stays at Level 2 |
| | `test_money_guard_enforces_single_monthly_and_demo_caps` | Monthly spend cap and per-decision caps enforced |
| **Security & Adversarial** | `test_suspicious_activity_is_immediate` | Fraud/suspicious activity triggers immediate Level 3 alert |
| | `test_irreversible_action_requires_confirmation` | Cancel/send/delete always asks first |
| | `test_sensitive_domain_always_requires_explicit_confirmation` | Health/money/legal always require explicit confirmation |
| **GDPR & Privacy** | `test_gdpr_sharing_requires_case_by_case_authorization` | Data sharing needs per-case authorization |
| | `test_family_context_and_retention_are_persisted` | Family data persisted with retention policy |
| **Family Permissions** | `test_family_permission_matrix_blocks_unauthorized_actor` | Teenager cannot authorize expenses; partner has selective powers |
| **Onboarding & Calibration** | `test_calibration_is_explicit_and_temporary` | Calibration period announced, temporary, extra notifications explained |
| **Explainability** | `test_level_one_has_explanation_and_local_undo_redo` | Every auto-action has explanation + undo capability |
| **Rollback** | `test_nonreversible_action_cannot_be_rolled_back` | Irreversible actions cannot be undone |
| **DND & Routing** | `test_smart_dnd_and_routing` | Smart Do Not Disturb raises threshold during sensitive times |
| **Offboarding** | `test_offboarding_preserves_handover_and_pauses_agent` | Deactivation preserves open tasks, pauses agent cleanly |
| **Memory & Learning** | `test_never_automate_and_rejection_are_remembered` | "No" is permanent; repeated suggestions stopped |
| | `test_repeated_approvals_propose_automation` | Repeated approvals suggest automation |
| **Silent Cost Detection** | `test_silent_cost_and_hidden_deadline_are_recorded` | Unused subscriptions and hidden deadlines flagged |
| **Metrics (KPI)** | `test_metrics_and_seasonal_forecast_are_actionable` | Metrics tracked, seasonal peaks anticipated |
| **Professional Advice** | `test_professional_advice_is_not_given_as_binding_advice` | Never gives medical/legal/financial binding advice |
| **Technical Failures** | `test_technical_failure_is_separate_and_resolvable` | Integration failures reported separately from decisions |
| **Manual Mode** | `test_manual_mode_blocks_classification_and_has_global_override` | Manual mode blocks all auto-classification |
| **Notification Limits** | `test_notification_limit_queues_nonurgent_decisions` | Non-urgent decisions queued when limit reached |
| **Default Outcome** | `test_default_outcome_is_in_decision_message` | Every Level 3 notification includes "what happens if you don't respond" |
| **Digest** | `test_digest_reports_pending_tasks` | Digest reports pending queued tasks |
| **Audit Chain** | `test_audit_chain_detects_tampering_and_crisis_is_localized` | Audit chain detects tampering; crisis data is isolated |
| **Business Model** | `test_business_and_dependency_summaries_are_operational` | Business summaries and dependency analysis work |
| **Domain Consent** | `test_domain_consent_is_specific_renewable_and_revocable` | Domain consent is specific, renewable, revocable |
| **Historical Import** | `test_historical_import_requires_consent_and_advances_cold_start` | Importing past data requires consent, advances calibration |
| **Rejection Reconsideration** | `test_rejection_can_be_reconsidered_with_new_elements` | Rejected decisions can be revisited with new info |

#### `test_api_server.py` — Backend & Auth (5 tests)

| Test | What it verifies |
|---|---|
| `test_registration_session_and_password_login` | User registration, session cookies, password login |
| `test_family_permissions_are_server_enforced` | Family permission matrix enforced server-side |
| `test_task_policy_audit_and_execution_gateway` | Task classification → audit → execution gate pipeline |
| `test_state_is_versioned_and_rejects_secrets` | State versioning, secret rejection |
| `test_http_auth_cookie_csrf_and_state_round_trip` | HTTP auth, CSRF protection, state persistence |

#### `test_lifecycle_simulation.py` — Pre-launch Simulation (6 tests)

| Test | What it verifies |
|---|---|
| `test_report_covers_six_months_and_every_day` | Simulation produces 180 days of data |
| `test_report_is_deterministic_for_same_seed` | Same seed → identical results |
| `test_new_profile_starts_at_prudent_baseline_and_trust_can_grow` | New user starts cautious, trust grows |
| `test_adversary_events_are_blocked_and_support_is_triggered` | Adversarial attacks blocked, support triggered |
| `test_safety_precedence_is_recorded` | Safety rules always override trust engine |
| `test_duration_is_bounded` | Simulation stays within time bounds |

---

## 2. JavaScript / Node Syntax Checks

```bash
node --check preview-server.mjs
node --check app/app.js
node --check app/sw.js
```

All three must exit with code 0 (no output on success).

---

## 3. File Integrity Check

```bash
node -e "const fs=require('fs'); const required=['app/index.html','app/app.js','app/styles.css','app/manifest.webmanifest','app/sw.js','preview-server.mjs','everyday_agent.py','api_server.py','lifecycle_simulation.py','test_everyday_agent.py','test_api_server.py','test_lifecycle_simulation.py','README.md','ARCHITECTURE.md','SUBMISSION.md','LICENSE','robots.txt','sitemap.xml']; const missing=required.filter(f=>!fs.existsSync(f)); if(missing.length){console.log('MISSING:',missing.join(', '));process.exit(1)} else console.log('All',required.length,'files present');"
```

Expected: `All 18 files present`

---

## 4. Manual UI Testing (Browser)

### Start the Application

```bash
node preview-server.mjs
```

Open: `http://127.0.0.1:4173/`

### Test Checklist

#### 4.1 Onboarding Flow

- [ ] Page loads with dark background (no white screen)
- [ ] Language selection appears (Italian / English)
- [ ] After selecting language, name prompt appears
- [ ] After entering name, calibration notice shown ("I'm still calibrating...")
- [ ] Policy acknowledgments displayed and must be accepted
- [ ] Dashboard loads after onboarding completes

#### 4.2 Dashboard Layout

- [ ] Dark theme renders correctly (no white backgrounds)
- [ ] All glassmorphism panels visible
- [ ] Navigation sidebar shows all domains: Home, Money, Health, Errands, Family
- [ ] Trust score displayed somewhere on dashboard
- [ ] No broken layouts or overlapping text

#### 4.3 Domain Navigation

- [ ] Clicking each domain (Home/Money/Health/Errands/Family) loads the correct view
- [ ] Each domain has relevant demo data
- [ ] Back navigation works

#### 4.4 Dynamic Trust Engine

- [ ] Trust scores visible for different action/provider combinations
- [ ] Trust updates after simulated interactions
- [ ] New counterparty starts at 20/100
- [ ] High trust unlocks higher spend limits

#### 4.5 Decision Flow

- [ ] Level 3 notifications appear with "what happens if you don't respond" message
- [ ] Approve/Reject buttons work
- [ ] Level 1 auto-executions show explanation link
- [ ] Undo available for reversible Level 1 actions

#### 4.6 Support Section

- [ ] Support section accessible (headphone icon)
- [ ] Clicking support opens AI assistant
- [ ] Assistant responds to basic questions

#### 4.7 Governance

- [ ] Governance panel accessible (shield icon)
- [ ] Family permission matrix visible
- [ ] Audit log shows recent actions
- [ ] Privacy controls accessible

#### 4.8 Settings

- [ ] Settings page loads
- [ ] Language can be changed
- [ ] Notification preferences adjustable
- [ ] Manual mode toggle works

#### 4.9 Pre-launch Simulation Lab

- [ ] Simulation accessible from dashboard
- [ ] Can configure user scenario (name, income, family)
- [ ] Running simulation produces day-by-day report
- [ ] Report shows actions, notifications, trust changes, adversarial events

#### 4.10 Landing Page (site/)

Navigate to `http://127.0.0.1:4173/site/`

- [ ] Landing page loads with correct dark theme
- [ ] FAQ page accessible and searchable
- [ ] Legal page loads
- [ ] 404 page works (try navigating to `/site/nonexistent`)
- [ ] Thank you page renders

#### 4.11 PWA / Offline

- [ ] `manifest.webmanifest` loads without error
- [ ] Service worker registers (check DevTools → Application → Service Workers)
- [ ] App works after going offline (basic caching)

#### 4.12 Mobile Responsiveness

- [ ] Resize browser to mobile width (375px)
- [ ] Navigation collapses or adapts
- [ ] Content remains readable
- [ ] No horizontal scroll overflow

---

## 5. What Is Real vs Simulated

| Component | Status |
|---|---|
| Trust Engine scoring | **Fully implemented** |
| 3-Level classification | **Fully implemented** |
| Policy enforcement | **Fully implemented** |
| Audit chain | **Fully implemented** |
| Family permissions | **Fully implemented** |
| GDPR controls | **Fully implemented** |
| Lifecycle simulation | **Fully implemented** |
| Adversarial testing | **Fully implemented** |
| Dashboard UI | **Fully implemented** |
| Landing page + FAQ | **Fully implemented** |
| PWA + offline cache | **Fully implemented** |
| Bank account access | **Simulated** |
| Email integration | **Simulated** |
| Calendar sync | **Simulated** |
| Healthcare records | **Simulated** |
| Payment execution | **Simulated** |
| Real notifications | **Simulated** |
| Supplier negotiation | **Simulated** |
| Real bookings | **Simulated** |

---

## 6. CI Quick Check (One Command)

Run everything in one shot:

```bash
py -3 -m unittest -v && node --check preview-server.mjs && node --check app/app.js && node --check app/sw.js && echo "ALL CHECKS PASSED"
```

Expected final line: `ALL CHECKS PASSED`
