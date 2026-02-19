<div align="center">
  <img src="https://img.shields.io/badge/Etherea-WebOS-0A0A0A?style=for-the-badge&logo=react&logoColor=cyan" alt="Etherea WebOS" />
  <h1>🌌 Etherea WebOS Environment</h1>
  <p><b>The Zero-Install, Emotionally Intelligent, Adaptive Workspace</b></p>
  <p>Built for the Innovation Design Thinking Exhibition</p>

  <a href="#-quick-execution-local"><img src="https://img.shields.io/badge/⚡_Quick_Start-0A0A0A?style=for-the-badge&logo=vite&logoColor=yellow" alt="Quick Start" /></a>
  <a href="#-monorepo-architecture"><img src="https://img.shields.io/badge/🧠_Architecture-0A0A0A?style=for-the-badge&logo=typescript&logoColor=blue" alt="Architecture" /></a>
  <a href="#-automated-diagnostics--smoke-tests"><img src="https://img.shields.io/badge/🩺_Diagnostics-0A0A0A?style=for-the-badge&logo=nodedotjs&logoColor=green" alt="Diagnostics" /></a>
  <a href="#-production-deployment-firebase"><img src="https://img.shields.io/badge/🌍_Deploy-0A0A0A?style=for-the-badge&logo=firebase&logoColor=orange" alt="Deploy" /></a>
</div>

---

## 📖 Executive Summary

**Etherea WebOS** is a revolutionary, cross-platform, browser-first deployment of the Etherea Adaptive Environment. Traditional operating systems are rigid, static, and completely oblivious to the cognitive load or emotional state of the user. This often leads to digital fatigue, burnout, and reduced productivity—especially among students facing rigorous academic demands.

Etherea solves this by introducing a **Living Workspace**. Engineered for seamless, zero-install interaction, this track bypasses heavy desktop dependencies (like Python/PySide6) and runs purely on modern web technologies (React, TypeScript, Vite). It features an intelligent core powered by local heuristic algorithms and secure cloud synchronization, dynamically adapting its UI, themes, and AI companion responses to the user's real-time state.

---

## 🧠 Monorepo Architecture

The Etherea WebOS project is structured as a highly scalable monorepo. This allows us to cleanly separate the frontend interface from the core mathematical heuristics and shared UI components, paving the way for future cross-platform scaling (Desktop Tauri / Android Capacitor).

### Directory Structure
    etherea-webos/
    ├── apps/
    │   ├── web/                  # Primary React/Vite web application
    │   ├── desktop-tauri/        # (Future) Rust-based desktop wrapper
    │   └── android-capacitor/    # (Future) Mobile port wrapper
    ├── packages/
    │   ├── core/                 # Framework-agnostic heuristics & state logic
    │   └── ui/                   # Shared React component library
    └── scripts/                  # CI/CD and self-check diagnostics

### System Data Flow

The system operates on a localized reactive loop to ensure the emotionally intelligent companion responds in real-time without absolute reliance on server-side processing.

    mermaid
    flowchart TD
      User[Exhibition Judge / User] --> UI[React Glassmorphic UI]
      
      subgraph Frontend Application (apps/web)
      UI --> Context[Workspace Context & State]
      Context --> Brain[useEthereaBrain.ts]
      Brain --> Avatar[Avatar Stage & Life Controller]
      end
      
      subgraph Core Engine (packages/core)
      Brain --> Heuristics[Heuristics Engine]
      Heuristics --> Registry[Event Registry]
      end
      
      subgraph Persistence Layer
      Registry --> Storage[Local IndexedDB / workspaceStore.ts]
      Brain --> Firebase[Firebase Functions / Sync]
      end
      
      Avatar --> Feedback[Visual & Audio Feedback]
      Feedback --> User

---

## ✨ Core Technical Features

### 1. The Local Heuristics Engine (`packages/core`)
Instead of waiting for an external API ping to decide how the OS should react, Etherea utilizes a local heuristics engine. This engine calculates workspace states, focus modes, and contextual nudges instantly within the client's browser, drastically reducing latency and ensuring a smooth experience.

### 2. Emotionally Intelligent Avatar Stage
The UI features a dedicated `AvatarStage.tsx` and `AvatarLifeController.tsx` that bring the Etherea companion to life. Using advanced framer-motion physics and synchronized timing loops, the avatar provides visual feedback, dynamic breathing cycles, and reactive expressions based on user interactions.

### 3. Graceful Degradation (Offline-First Design)
Etherea is built to survive network interruptions. State management is tied to robust browser storage (`workspaceStore.ts`). If the Wi-Fi drops, the local brain continues to function, allowing the user to maintain their focus session, read notes, and interact with the UI. Once reconnected, it seamlessly syncs with the Firebase backend.

### 4. Glassmorphic Aesthetic
The entire UI is built using modern CSS principles (Tailwind CSS and custom Aura CSS), utilizing `backdrop-blur`, complex conic gradients, and translucent borders to simulate a high-tech, deep-space, "living" glass canvas.

---

## ⚡ Quick Execution (Local Development)

To run the exhibition build locally on your machine with zero configuration overhead, follow these exact steps.

### Prerequisites
* Node.js (v18 or higher recommended)
* npm (v9 or higher)
* Git

### Installation Steps

1. Clone the repository and navigate to the project root:
    git clone <repository-url>
    cd etherea-adaptive-os

2. Install WebOS dependencies (safe to run from the repository root):
    npm run setup:webos

3. Boot the development server specifically for the Web App:
    npm run dev:webos

   (Alternative direct command if you prefer entering the monorepo manually: `cd etherea-webos && npm install && npm run dev --workspace=apps/web`.)

4. Access the environment:
    Open your browser and navigate to `http://localhost:5173` (or the port specified in your terminal).

---

## 🩺 Automated Diagnostics & Smoke Tests

To ensure maximum stability before presenting to the judges or pushing to production, the repository includes a suite of custom diagnostic scripts. These scripts verify repository integrity, heuristic logic, and security rules.

1. Execute the Core WebOS Sanity Check:
   This custom script checks for the presence of necessary configuration files and validates the monorepo structure.
    node scripts/selfcheck_webos.mjs

2. Verify Core Packages & Heuristic Algorithms:
   Run the localized unit tests to ensure the mathematical models in the brain engine are functioning perfectly.
    npm test --workspace=packages/core

3. Scan for Unauthorized Binaries (Security Check):
   Etherea maintains a strict policy against arbitrary binary commits to ensure repository lightness and security.
    node scripts/binary-guard.mjs

---

## 🌍 Production Deployment (Firebase)

When you are ready to push the finalized, optimized build to global edge nodes for the live exhibition, utilize Firebase Hosting.

1. Install the Firebase CLI (if not already installed globally):
    npm install -g firebase-tools

2. Authenticate your Firebase environment:
    firebase login

3. Ensure you are targeting the correct project (replace with your Etherea project ID):
    firebase use etherea-os-production

4. Compile the heavily optimized production build for the web app:
    npm run build --workspace=apps/web

5. Deploy the application to Firebase Hosting:
    firebase deploy --only hosting

---

## 🤝 Core Team & Engineering Contributors

Etherea is the result of rigorous cross-functional collaboration. The engineering lifecycle spans product strategy, systems architecture, AI behavioral design, frontend deployment, and QA operations.

| Team Member | Core Responsibilities & Contributions |
| :--- | :--- |
| **Brunda G** | System architecture, Monorepo organization, module dependency planning, React coding standards, and total integration coordination. Client-side development support and component styling |
| **Chandramma** | Technical documentation, self-awareness module integration, and database/storage management. |
| **Ayathunnisa**| Design systems, lab/environment setup, and creative production support for UI assets. |
| **Azra Rahman**| Cross-module implementation support, hardware/software limitation analysis, and feature collaboration. |
| **Chinmai HA** | Runtime feature support, database assistance, and core brain-integration logic collaboration. |
| **Arshiya Khanum**| Deep debugging, QA validation, diagnostic script testing, and workflow stability. |

---

## 🎓 Academic Guidance

This project was developed under expert academic supervision for the Innovation Design Thinking curriculum.

| Guide Name | Department | Role |
| :--- | :--- | :--- |
| **Mrs. Radhika S N** | Department of Computer Science & Engineering | Project Guide & Mentor |

---

> *Acknowledgments: Built utilizing open-source ecosystems including React, Vite, Framer Motion, and Firebase. Etherea represents the future of humane, adaptive computing.*

## 🧯 npm ENOENT Quick Fix

If npm reports `ENOENT: no such file or directory, open .../package.json`, you are running npm in the wrong directory.

Use:

```bash
cd /path/to/etherea-adaptive-os
npm run setup:webos
npm run dev:webos
```

The Web app lives under `etherea-webos/apps/web`, so `cd apps/web` from your home folder will fail.
