<p align="center">
  <img src="public/img/logo_solid.png" alt="PainHunter" width="200" />
</p>

<h1 align="center">PainHunter</h1>

<p align="center">
  <b>Mr Hunter</b> — your personal well-being assistant. An empathetic AI interviewer that listens without judgment, detects signs of pain and discomfort, and delivers personalized conclusions and recommendations after every conversation.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue" />
  <img src="https://img.shields.io/badge/Vite-5-purple" />
  <img src="https://img.shields.io/badge/Tailwind-3-38bdf8" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28" />
  <img src="https://img.shields.io/badge/FastAPI-009688" />
  <img src="https://img.shields.io/badge/Python-3.11-green" />
</p>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone the repository](#1-clone-the-repository)
  - [2. Start the local AI server](#2-start-the-local-ai-server)
  - [3. Configure the frontend](#3-configure-the-frontend)
  - [4. Run the frontend](#4-run-the-frontend)
  - [5. Build for production](#5-build-for-production)
- [Backend API Endpoints](#backend-api-endpoints)
- [Database Structure (Firebase Realtime Database)](#database-structure-firebase-realtime-database)
- [Roles & Super Users](#roles--super-users)
- [How the AI Interview Works](#how-the-ai-interview-works)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Overview

**PainHunter** is a mental and emotional well-being platform with a private, fully local AI. A user creates an account, starts a chat with **Mr Hunter**, and after every conversation the AI:

1. Detects and classifies signs of pain, fatigue, stress, insomnia, and anxiety.
2. Registers automatic **pain notes** for follow-up.
3. Generates a **conclusion** and a **recommendation** at the end of each session.

A supervision panel lets **super users** (Admin, Guard, Boss) inspect users, conversations, and AI-generated diagnoses.

> The entire language model runs **locally** on your machine (llama.cpp + GGUF). No personal data ever leaves your device.

---

## Features

- 💬 **Chat with Mr Hunter** — an empathetic interviewer that asks one open question at a time.
- 🤖 **Local AI (private)** — Qwen 1.5B / 0.5B GGUF models served by a Python FastAPI backend.
- 🎙️ **Voice transcription** — audio messages transcribed with `faster-whisper` (Whisper).
- 📝 **Automatic pain notes** — the model emits structured notes (`###NOTAS###`) extracted at stream time.
- 🩺 **Pain detection & classification** — `es_dolor` flag from AI decision plus keyword matching.
- 🧾 **AI conclusion & recommendation** — generated at the end of every conversation.
- 🔐 **Authentication** — Firebase Auth (email/password) with registration.
- 🗃️ **Realtime Database** — users, conversations, notes, and admin roles in Firebase RTDB.
- 👑 **Super-user panel** — Admin, Guard and Boss roles with stats and conversation inspection.
- 🔔 **Toast notifications** — global notification system.
- 🌐 **Landing page** — official marketing page with hero, features, testimonials and FAQ.

---

## Architecture

```
┌──────────────────────────┐         ┌───────────────────────────────┐
│  React + Vite (Netlify)  │  HTTP   │  Python FastAPI (localhost)   │
│                          │ ──────► │  /api/chat/stream  (SSE)      │
│  - Chat UI               │  SSE    │  /api/transcribe   (Whisper)  │
│  - Landing page          │ ◄────── │  /api/conclusion              │
│  - Admin panel           │         │  /api/title                   │
└──────────────────────────┘         └───────────────────────────────┘
        │                                     │
        │ Firebase Auth + Realtime Database   │ llama.cpp (Qwen GGUF)
        ▼                                     ▼
┌──────────────────────────┐         ┌───────────────────────────────┐
│  Firebase (cloud)        │         │  Local model (your machine)   │
│  users / conversations / │         │  qwen2.5-*-q4_k_m.gguf        │
│  admins / notes          │         └───────────────────────────────┘
└──────────────────────────┘
```

- The **frontend** talks to **Firebase** for auth and persistence.
- The **backend** runs locally on `localhost:8000` and serves the LLM via Server-Sent Events (SSE).
- Streaming responses also carry structured **notes** parsed in real time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3, React Router 6, Lucide icons |
| Backend | Python, FastAPI, Uvicorn, llama-cpp-python |
| ML models | Qwen 2.5 1.5B / 0.5B (GGUF Q4_K_M), faster-whisper |
| Data & Auth | Firebase Auth, Firebase Realtime Database |
| Deployment | Vite static build → Netlify (frontend only) |

---

## Project Structure

```
PainHunter/
├── index.html
├── package.json
├── tailwind.config.js
├── .env                        # Frontend Firebase env vars (not committed)
├── public/
│   └── img/                    # Logos and images
├── server/
│   ├── app.py                  # FastAPI backend (chat, transcribe, conclusion, title)
│   ├── requirements.txt
│   ├── start-ai.bat            # One-click local AI launcher (Windows)
│   ├── scripts/
│   │   └── download_model.py   # Downloads the GGUF model
│   └── models/                 # GGUF model files (downloaded)
│       ├── qwen2.5-0.5b-instruct-q4_k_m.gguf
│       └── qwen2.5-1.5b-instruct-q4_k_m.gguf
└── src/
    ├── main.jsx                # Routes and providers
    ├── firebase.js             # Firebase initialization
    ├── index.css               # Tailwind + custom animations
    ├── contexts/               # AuthContext, ToastContext
    ├── hooks/                  # useChat, usePageTitle, useReveal
    ├── services/               # chatService, adminService, firebaseService
    ├── pages/                  # LandingPage, AuthPage, SuperUserLogin, AdminPanel, App
    └── App.jsx                 # Main chat application
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+ (with `pip`)
- A **Firebase project** with Auth (email/password) and Realtime Database enabled

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd PainHunter
```

### 2. Start the local AI server

> On Windows, just double-click `server\start-ai.bat`. It creates a virtual environment, installs dependencies, downloads the model (if missing) and starts the server at `http://localhost:8000`.

```bash
cd server
python -m venv venv
venv\Scripts\activate          # Windows (or `source venv/bin/activate` on macOS/Linux)
pip install --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu "llama-cpp-python"
pip install -r requirements.txt
python scripts\download_model.py 0.5b   # or 1.5b
python app.py
```

Check the server is up:

```bash
curl http://localhost:8000/health
# → {"status": "ok"}
```

### 3. Configure the frontend

Create a `.env` file in the project root with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=1:...
VITE_FIREBASE_MEASUREMENT_ID=G-...
```

### 4. Run the frontend

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and you are ready to chat with Mr Hunter.

### 5. Build for production

```bash
npm run build
```

The static site is generated in the `dist/` folder.

---

## Backend API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/chat/stream` | Streaming chat (SSE). Returns `content` chunks and parsed `notes`. |
| `POST` | `/api/transcribe` | Transcribes an uploaded audio file (Whisper). |
| `POST` | `/api/conclusion` | Generates `{ content, es_dolor, recomendacion }` for a conversation. |
| `POST` | `/api/title` | Generates a short conversation title. |

**`/api/chat/stream` request body**

```json
{
  "user_name": "Angello",
  "messages": [
    { "role": "user", "content": "Hola, últimamente me siento muy cansado." }
  ]
}
```

**SSE response**

```
data: {"content":"Entiendo, Angello..."}

data: {"content":"..."}

data: {"notes":["Lleva cansancio hace meses","Menciona dolores de cabeza"]}

data: [DONE]
```

**`/api/conclusion` response**

```json
{
  "content": "El usuario, Angello, se encuentra en una situación de cansancio...",
  "es_dolor": true,
  "recomendacion": "Asegúrate de tomar descansos regulares..."
}
```

---

## Database Structure (Firebase Realtime Database)

```
pain-hunter-default-rtdb (europe-west1)
├── users/
│   └── {uid}/
│       ├── name: string
│       └── gender: string
├── admins/
│   └── {uid}/
│       └── role: "ADMIN" | "VIGILANTE" | "BOSS"
├── conversations/
│   └── {uid}/
│       └── {chatId}/
│           ├── title: string
│           ├── messages: [...]
│           ├── notas: [...]
│           ├── conclusion: string
│           ├── es_dolor: boolean
│           └── recomendacion: string
```

**Security rules (summary)**

- Regular users can only read/write their own `conversations/{uid}` node.
- Users with a role in `admins/{uid}` can read `users`, `conversations` and `admins`.

---

## Roles & Super Users

| Role | Permissions |
|---|---|
| **ADMIN** | Full access to the admin panel and all data |
| **VIGILANTE** (Guard) | Can monitor conversations |
| **BOSS** | Highest-level monitoring |

Super users log in through the dedicated `/superusers` route. A normal login attempt with a super-user account is blocked with a toast notification directing them to the correct access point.

---

## How the AI Interview Works

1. The user starts a conversation with Mr Hunter.
2. Mr Hunter follows a structured method: **opening → exploration → deepening (5 Whys) → motivation → closing**.
3. The model is instructed to always respond in Spanish, 1–3 sentences, with **one question at a time**.
4. When the user shares important details, the model appends `###NOTAS###` followed by a JSON list — the backend extracts these in real time and saves them as **pain notes**.
5. After the conversation, `/api/conclusion` analyzes the messages and produces:
   - **content** — the AI conclusion,
   - **es_dolor** — `true` if the conversation indicates pain/discomfort (AI decision or keyword match),
   - **recomendacion** — a tailored recommendation.
6. The conclusion, pain classification and recommendation are persisted to the conversation node.

---

## Deployment

### Frontend (Netlify)

The frontend is a static Vite site and deploys directly to Netlify:

```bash
npm run build
```

- **Build command:** `npm run build`
- **Publish directory:** `dist`

### Backend

> ⚠️ Netlify **cannot** run the Python AI backend (persistent process, local GGUF model, no GPU/CPU guarantees).

To make the AI work in production you have to host the FastAPI backend elsewhere:

1. **Tunnel (demo):** expose your local server with Cloudflare Tunnel or ngrok and update `API_URL` in `src/services/chatService.js`.
2. **Render / Railway:** deploy `server/` as a web service (requires ≥ ~2 GB RAM for the 1.5B model).
3. **VPS:** a small server (e.g. Hetzner, Oracle Cloud Free) running `python app.py`.
4. **Cloud AI API:** replace `llama_cpp` calls with OpenAI / OpenRouter API and drop the Python backend entirely.

---

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_DATABASE_URL` | Realtime Database URL |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `VITE_FIREBASE_APP_ID` | App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Measurement ID |

> All Firebase credentials are read from `.env` (gitignored). **Never commit real keys.**

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `npm.ps1` is blocked on Windows PowerShell | Use `npm.cmd run dev` instead of `npm run dev` |
| Chat answers very slowly | Switch to the 0.5B model or increase `max_tokens`; CPU inference is inherently slow |
| `Permission denied` on database writes | Check that the Firebase rules allow users to write their own `conversations/{uid}` node |
| Backend changes not applied | Restart the Python server (`python app.py`) after editing `app.py` |
| Model download fails | Run `python scripts\download_model.py 0.5b` again or download the GGUF manually into `server/models/` |
| CORS errors | Make sure `localhost:8000` is allowed in `app.py`'s CORS configuration |

---

## License

This project is for educational and demonstration purposes. The **Qwen** models are subject to their original license; check [QwenLM](https://github.com/QwenLM) for details.
