# Etherea Adaptive OS v3

Etherea is an **emotionally intelligent companion OS experience** that blends a cinematic avatar interface, adaptive workspace orchestration, and privacy-aware local intelligence.  
It includes a flagship desktop runtime (PySide6) plus web/Firebase deployment tracks for demo and cloud-assisted workflows.

---

## Product Introduction

**Etherea Adaptive OS v3** is designed as a companion computing layer that helps users stay focused, calm, and effective while working.

Core outcomes:
- Adaptive interaction: voice + text + teaching flows.
- Emotional context signals (e.g., stress/focus) used to tune pacing and assistance.
- Privacy-first behavior with resilient local fallback modes.
- Avatar-led UX for guidance, explanations, and onboarding.

---

## What Exactly Is the Product?

### Canonical Product (Primary)
- **Desktop application** built with **PySide6**.
- Entry points:
  - `python main.py`
  - `python etherea_launcher.py`
- Main window implementation: `corund/ui/main_window_v3.py`.

### Companion Tracks (Secondary)
- `frontend/`: Vite + React experience (Firebase Hosting target).
- `functions/`: Firebase Cloud Functions backend integration.
- `etherea-webos/`: Extended web/desktop/android prototype track.

> If you are evaluating “the core Etherea product,” use the **desktop runtime first**.

---

## High-Level Architecture

```mermaid
flowchart LR
  User((User)) --> UX[Avatar UI + Workspace Shell]
  UX --> Brain[Etherea Decision Brain]
  Brain --> Signals[State + Stress Signals]
  Brain --> Memory[Local Memory + Persistence]
  Brain --> Tools[Tool Router / Capabilities]
  Tools --> LocalApps[Desktop Workspaces / Integrations]
  Brain --> CloudBridge[Optional Firebase + Gemini Bridge]
  CloudBridge --> UX
  Memory --> UX
```

---

## Etherea “Aetheria Chain Link” Workflow

This diagram shows how user intent, sensing, memory, and the “brain chain” collaborate.

```mermaid
sequenceDiagram
  participant U as User
  participant UI as Avatar / Workspace
  participant S as Stress Sensing Layer
  participant B as Etherea Brain Chain
  participant M as Memory Layer
  participant T as Tool/Action Router
  participant C as Cloud Assist (Optional)

  U->>UI: Voice/Text/Interaction input
  UI->>S: Input telemetry (WPM, pointer rhythm, context)
  S->>B: normalized state (stressLevel, interactionMode)
  UI->>B: explicit intent + UI context
  B->>M: read profile/session/history
  M-->>B: prior preferences + continuity

  alt Local-first route
    B->>T: plan actions + safe response
    T-->>UI: execute UI guidance / workspace action
  else Cloud-assisted route
    B->>C: structured request (policy constrained)
    C-->>B: response payload
    B->>T: validated action plan
    T-->>UI: execute + narrate
  end

  UI-->>U: emotionally aware response + next-step guidance
  B->>M: persist outcome + learning state
```

---

## “Brain Works” Pipeline (Decision Loop)

```mermaid
flowchart TD
  A[Capture Intent] --> B[Context Assembly]
  B --> C[Policy + Safety Guardrails]
  C --> D[State Evaluation\nfocus, stress, mode]
  D --> E[Plan Generation]
  E --> F{Execution Path}
  F -->|Local| G[Run Local Action]
  F -->|Cloud| H[Call Firebase Function]
  H --> I[Validate Structured Output]
  G --> J[Render Avatar + Workspace Updates]
  I --> J
  J --> K[Persist Session State]
  K --> L[Feedback for Next Turn]
  L --> A
```

---

## Repository Map

```text
.
├── corund/                  # Core desktop runtime logic (primary product)
├── frontend/                # Vite + React frontend deployment target
├── functions/               # Firebase Cloud Functions backend
├── etherea-webos/           # Multi-platform prototype track
├── docs/                    # Product docs, reports, deployment notes
├── scripts/                 # Tooling, validation, utility scripts
├── tests/                   # Python test suite
├── firebase.json            # Hosting + Functions config
└── README.md
```

---

## Quick Start

### 1) Desktop (Recommended First)

```bash
python main.py
```

Alternative launcher:

```bash
python etherea_launcher.py
```

### 2) Python Test/Health Check

```bash
./scripts/etherea-doctor
```

---

## Firebase / Web Deployment Track

For production deployment steps, use:
- `docs/firebase_production_deploy.md`
- `tools/firebase_deploy.sh`

Canonical command flow:

```bash
npm install -g firebase-tools
firebase login
firebase use <your-project-id> --add
firebase functions:secrets:set GEMINI_API_KEY --project <your-project-id>
cd frontend && npm ci && npm run build && cd ..
firebase deploy --project <your-project-id>
```

---

## Security, Privacy, and Reliability Principles

- Local-first behavior with graceful degradation paths.
- Sensitive keys handled via Firebase Secret Manager (not committed to repo).
- Guardrails for unsafe or malformed responses.
- Fallback behavior when optional UI/runtime dependencies are unavailable.

---

## Asset Policy

- No AI agent should generate or commit arbitrary binary assets.
- Assets are curated and must include safe runtime fallback behavior.

---

## Contributors

> Contributors section will be expanded with your exact names/roles in the next pass.

Current maintainership signal:
- Etherea core direction by **Bru and the Etherea team**.

---

## License & Usage

If you are packaging or redistributing Etherea variants, align with repository policy and deployment constraints documented in `docs/`.

