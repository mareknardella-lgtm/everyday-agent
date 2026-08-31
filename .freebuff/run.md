# Everyday Agent — Run Instructions

## Project structure

```
/
├── site/                         ← Landing pages pubbliche
├── app/                          ← Dashboard Ops Analytics
│   ├── index.html                ← Dashboard unificata
│   ├── styles.css                ← Stili base
│   ├── ops-overrides.css         ← Tema Ops Analytics
│   ├── simulation.css            ← Pannello laboratorio pre-lancio
│   └── app.js                    ← Logica dashboard
├── preview-server.mjs            ← Server statico + report simulatione
├── everyday_agent.py             ← Motore di fiducia Python
├── lifecycle_simulation.py       ← Simulazione multi-agente deterministica
├── simulation-report.json        ← Ultimo report generato
├── test_lifecycle_simulation.py  ← Test della simulazione
├── PRELAUNCH_SIMULATION.md       ← Protocollo e limiti del test
├── MASTER_POLICY.md              ← Policy v1.1 con correzioni simulate
├── api_server.py                 ← API locale opzionale
├── test_everyday_agent.py
├── test_api_server.py
├── README.md
├── ARCHITECTURE.md
├── SUBMISSION.md
├── LICENSE
└── agent.config.example.json
```

## How to start the preview server

No npm install or build step is required.

```bash
PORT=4174 node preview-server.mjs
```

On PowerShell:

```powershell
$env:PORT="4174"; node preview-server.mjs
```

Open `http://127.0.0.1:4174/`. The root and `/app/` serve the same dashboard.

Routes:
- `/` → dashboard principale
- `/app/` → stessa dashboard principale
- `/site/` → landing page pubblica
- `/site/faq/` → FAQ
- `/simulation-report.json?days=365&seed=20260831` → report JSON temporaneo
- unknown paths → pagina 404 con status HTTP 404

## How to reproduce artifacts

Files are served statically. No dependency installation or build artifact is required. To regenerate the checked-in reference report:

```bash
py -3 lifecycle_simulation.py --days 365 --seed 20260831 --output simulation-report.json
```

## Simulation

From the dashboard, open `Governance > Pre-launch lab`, choose 6, 12, or 24 months, and select `Esegui simulazione`. The run is deterministic and offline; it does not mutate user state or contact external services. The downloadable JSON contains the daily log, role descriptions, metrics, adversarial events, contradictions, and policy corrections.

## Tests

```bash
py -3 -m unittest -v          # 53 tests
node --check app/app.js
node --check preview-server.mjs
py -3 -m py_compile lifecycle_simulation.py test_lifecycle_simulation.py
```
