# Hackathon Submission Pack

## Text description

Everyday Agent is a trust-first personal operating system for people and families who want less mental load without giving up control. It organizes home, money, health, errands, family, calendar and support workflows in one dark operations dashboard.

Its differentiator is the **Dynamic Trust Engine**. Instead of using a generic rule such as “ask above €50”, it calculates a separate 0–100 trust score for each combination of action, counterparty and context. A new combination starts at 20/100. Fast approvals raise trust, slow responses raise it less, rejections reduce it sharply and inactivity makes trust decay toward the cautious baseline. Safety caps, consent, family permissions and manual mode always override trust.

The current submission is an offline local prototype. It includes working local interactions, persistence, governance controls, a deterministic multi-role lifecycle simulation and automated tests. External banking, email, healthcare, booking and payment integrations are intentionally not enabled.

## Who is it for?

- People managing recurring household and personal tasks
- Families sharing deadlines while keeping permissions separate
- Users who want automation without constant notifications
- Privacy-conscious users who need visible boundaries and local controls

## Why it matters

Traditional assistants optimize for more features or more engagement. Everyday Agent optimizes for useful silence: it handles low-risk work without unnecessary interruption and surfaces only decisions that genuinely need a person. Trust becomes personal, explainable and reversible instead of being a fixed threshold applied to everyone.

## How to run

Requirements: Node.js 18+ and Python 3.11+. No npm dependencies are required.

```bash
node preview-server.mjs
```

Open `http://127.0.0.1:4173/`.

Run the tests:

```bash
py -3 -m unittest -v
```

Run the deterministic simulation:

```bash
py -3 lifecycle_simulation.py --days 365 --seed 20260831 --output simulation-report.json
```

## Five-minute demo script

### 0:00–0:35 — Problem

“People do not need another chatbot demanding attention. They need something that handles repetitive work without creating anxiety. Fixed thresholds do not work: I may trust my plumber for €300, but not a new provider for €20.”

### 0:35–1:05 — Users and value

“Everyday Agent is for people and families managing home, deadlines, money and daily commitments. It works quietly when the risk is low and asks for a real decision only when one is needed.”

### 1:05–2:25 — Working demo

1. Show onboarding, language selection and the explicit “what I will never do” boundaries.
2. Create a request involving a new provider.
3. Show the cautious 20/100 trust profile and confirmation request.
4. Approve or reject the request and show the profile update.
5. Open the Control Feed, calendar and time tracker.
6. Open Governance and run a personalized six- or twelve-month pre-launch simulation.
7. Show the report metrics, contradictions and downloadable log.

### 2:25–3:15 — Safety and governance

“Trust is never authorization by itself. Money, health, legal documents, suspicious activity, irreversible actions and minors remain behind fixed protections. The demo includes manual mode, family permissions, explanation, audit, local correction and offboarding.”

### 3:15–4:05 — Architecture

Show `ARCHITECTURE.md`: the UI, local state, optional backend, Dynamic Trust Engine, policy gate, audit layer, separate executor boundary and adversarial simulation.

### 4:05–4:40 — Differentiation

“The advantage is not the number of features. It is a behavioral memory specific to each person: approvals, rejections, corrections and time decay. After months of real interactions, the agent is calibrated to the user instead of applying the same threshold to everyone.”

### 4:40–5:00 — Honest close

“This prototype does not make real payments, send emails or access health systems. It demonstrates the control model and the safety boundary. Everyday Agent is not trying to be the agent with the most features; it is trying to be the agent people can trust because it knows when to act, inform or ask.”

## Architecture diagram asset

The repository includes both formats required for review:

- [ARCHITECTURE.md](ARCHITECTURE.md) with the detailed Mermaid diagram, component map, request lifecycle, security precedence, API path and simulation sequence.
- [architecture-diagram.svg](architecture-diagram.svg), a standalone 1600x1100 visual suitable for slides or an image upload.

The diagram makes the prototype boundary explicit: browser and local policy flows are implemented, the pre-launch lab is synthetic, and external side effects remain blocked because no provider credentials or live connectors are included.

## Submission checklist

- [ ] Make the GitHub repository public and provide its URL in the hackathon form.
- [ ] Confirm `LICENSE` is visible and detected as MIT in the repository.
- [ ] Confirm `README.md` and `ARCHITECTURE.md` render publicly.
- [ ] Record a demo video no longer than five minutes.
- [ ] State clearly in the video which capabilities are local and which integrations are simulated.
- [ ] Add the AWS Builder ID to the official form if requested.
- [ ] Do not publish passwords, tokens, `.env` files, databases, browser memory or personal data.
- [ ] Submit the public repository URL, not the local `127.0.0.1` preview URL.
