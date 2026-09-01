# Everyday Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status: pre-launch prototype](https://img.shields.io/badge/status-pre--launch%20prototype-blue.svg)](LEGAL_COMPLIANCE_BASELINE.md)

Everyday Agent is a trust-first personal operating system for people and families who want less mental load without giving up control. Instead of applying one generic rule to every task, it learns a separate trust score for each combination of **action, counterparty and context**.

> **Prototype disclosure:** this repository contains a local, pre-launch demo. It does not connect to banks, email, healthcare systems or vendors; it does not make payments, send messages, sign contracts or provide professional advice. Read [LEGAL_COMPLIANCE_BASELINE.md](LEGAL_COMPLIANCE_BASELINE.md) before using or presenting it.

## Why it matters

Most assistants create another stream of notifications or use rigid thresholds such as “ask above €50”. Real trust is more specific: a user may trust a known plumber for €300 but not a new provider for €20. Everyday Agent starts cautiously and learns from approvals, rejections, hesitation and corrections while keeping absolute safety caps for money, health and legal documents.

## Who it is for

- People managing recurring household and personal tasks
- Families sharing deadlines but using different permission levels
- Users who want automation without constant interruptions
- Privacy-conscious users who want local storage and visible boundaries

## How it works

1. **Onboarding:** the user chooses a language, enters a name and accepts explicit operational boundaries.
2. **Request intake:** a task is normalized into action, counterparty, context, domain, amount and reversibility.
3. **Dynamic trust:** a new combination starts at 20/100. Fast approvals raise trust more than slow approvals; rejections reduce it sharply; inactivity causes decay toward the cautious baseline.
4. **Policy gate:** sensitivity, consent, family permissions, manual mode, urgency, reversibility and spending caps are checked before any autonomy decision.
5. **Control:** the result is either a local action, a digest item or a confirmation request. Every decision can expose its reason, and supported local actions have correction/undo flows.
6. **Audit and learning:** the outcome is recorded locally and updates only the relevant trust profile.

## Included in the demo

- Dark ops-analytics dashboard with Control Feed
- Home, Money, Health, Errands, Family, Calendar and Support sections
- Dynamic Trust Engine with profile-specific decay and imported-trust safeguards
- Onboarding, language selection and a 14-day calibration period
- Explainability, local audit chain, manual mode, undo/redo and crisis handling
- Family permission matrix and selective routing concepts
- Local reminders, calendar durations and time tracking
- Offline PWA assets, service-worker cache and compact Support shortcut
- Governance panel with GDPR-oriented local export/deletion controls
- Seasonal deadline radar, silent-cost concepts and offboarding handover package
- Deterministic six-to-twenty-four-month pre-launch lifecycle simulation
- Python test suite covering policy, security caps, trust learning and adversarial scenarios

## What is simulated

The demo intentionally does **not** claim to provide production integrations. Banking, real payments, email, external calendars, healthcare records, bookings, smart-home commands, provider negotiation, push delivery with a closed browser and human support escalation remain integration work. The UI may represent these capabilities locally, but no third party is contacted.

## Run the web demo

Requirements:

- Node.js 18 or newer
- Python 3.11 or newer for the test suite and lifecycle simulator
- No npm packages are required

From the repository root:

```bash
node preview-server.mjs
```

Open:

```text
http://127.0.0.1:4173/
```

Useful routes:

- `http://127.0.0.1:4173/site/` — public landing page
- `http://127.0.0.1:4173/site/faq/` — FAQ with search and filters
- `http://127.0.0.1:4173/site/legal/` — pre-launch legal disclosure
- `http://127.0.0.1:4173/app/` — dashboard entry point

You can also open `index.html` with VS Code Live Server. The root entry point forwards to the current dashboard in `app/`; the full simulation endpoint requires `preview-server.mjs`.

## Run the optional local backend

The backend is local-only and is not connected to external providers:

```bash
python api_server.py --serve-static
```

It provides local account/session, CSRF, SQLite workspace and server-side policy demonstrations. Do not use it as a production deployment without an independent security, privacy and legal review.

## Run tests and the simulator

```bash
py -3 -m unittest -v
```

Run a deterministic 12-month simulation:

```bash
py -3 lifecycle_simulation.py --days 365 --seed 20260831 --output simulation-report.json
```

The dashboard also exposes the simulator under **Governance → Pre-launch Lab**, where you can customize the synthetic user, household, income, trusted provider and habits. The scenario uses synthetic data only.

## Architecture diagram

The full architecture is documented in [ARCHITECTURE.md](ARCHITECTURE.md). It includes the client, policy core, Dynamic Trust Engine, persistence, optional local API, simulation lab and the blocked external side-effect boundary. A standalone SVG version is available at [architecture-diagram.svg](architecture-diagram.svg) for slides and the hackathon submission.

## Repository map

```text
app/                       Dashboard HTML, CSS, JavaScript and PWA assets
site/                      Landing page, FAQ, legal disclosure and 404 page
everyday_agent.py          Core policy and Dynamic Trust Engine
api_server.py              Optional local backend with auth and policy checks
lifecycle_simulation.py    Deterministic multi-role pre-launch simulation
preview-server.mjs         Dependency-free local web server and simulation route
test_*.py                  Automated tests
ARCHITECTURE.md            Mermaid architecture diagram
SUBMISSION.md              Hackathon description and five-minute demo script
MASTER_POLICY.md           Versioned operational policy
PRELAUNCH_SIMULATION.md    Simulation methodology and findings
LEGAL_COMPLIANCE_BASELINE.md  Pre-launch legal/security checklist
DESKTOP.md                PWA and future desktop packaging notes
LICENSE                    MIT license
```

## Safety and legal boundary

The project is designed around human control, least privilege, explicit consent, absolute caps, explainability, auditability, recovery and offboarding. These design choices do not make the product lawsuit-proof or legally compliant by themselves. Before a production launch, obtain qualified legal/privacy advice for each target market, document the actual data flows and publish final Terms, Privacy Notice, retention policy, support process, accessibility statement and integration contracts.

Do not enter real financial, health, legal, authentication or family-sensitive data into this prototype. Do not present the simulated integrations as live capabilities.

## License

This project is released under the [MIT License](LICENSE).
