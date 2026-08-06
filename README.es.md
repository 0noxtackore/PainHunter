<p align="center">
  <img src="public/img/logo_solid.png" alt="PainHunter" width="200" />
</p>

<h1 align="center">PainHunter</h1>

<p align="center">
  <b>Mr Hunter</b> — tu asistente personal de bienestar. Un entrevistador con IA empático que te escucha sin juicios, detecta señales de dolor y malestar, y entrega conclusiones y recomendaciones personalizadas al final de cada conversación.
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

## Índice

- [Descripción general](#descripción-general)
- [Características](#características)
- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Primeros pasos](#primeros-pasos)
  - [Requisitos](#requisitos)
  - [1. Clonar el repositorio](#1-clonar-el-repositorio)
  - [2. Iniciar el servidor de IA local](#2-iniciar-el-servidor-de-ia-local)
  - [3. Configurar el frontend](#3-configurar-el-frontend)
  - [4. Ejecutar el frontend](#4-ejecutar-el-frontend)
  - [5. Compilar para producción](#5-compilar-para-producción)
- [Endpoints del backend](#endpoints-del-backend)
- [Estructura de la base de datos (Firebase Realtime Database)](#estructura-de-la-base-de-datos-firebase-realtime-database)
- [Roles y superusuarios](#roles-y-superusuarios)
- [Cómo funciona la entrevista con IA](#cómo-funciona-la-entrevista-con-ia)
- [Despliegue](#despliegue)
- [Variables de entorno](#variables-de-entorno)
- [Solución de problemas](#solución-de-problemas)
- [Licencia](#licencia)

---

## Descripción general

**PainHunter** es una plataforma de bienestar mental y emocional con una IA privada y 100% local. El usuario crea una cuenta, inicia un chat con **Mr Hunter** y, tras cada conversación, la IA:

1. Detecta y clasifica señales de dolor, cansancio, estrés, insomnio y ansiedad.
2. Registra **notas de dolor** automáticas para su seguimiento.
3. Genera una **conclusión** y una **recomendación** al final de cada sesión.

Un panel de supervisión permite a los **superusuarios** (Admin, Vigilante, Boss) inspeccionar usuarios, conversaciones y los diagnósticos generados por la IA.

> Todo el modelo de lenguaje se ejecuta **localmente** en tu equipo (llama.cpp + GGUF). Ningún dato personal sale de tu dispositivo.

---

## Características

- 💬 **Chat con Mr Hunter** — un entrevistador empático que hace una sola pregunta abierta a la vez.
- 🤖 **IA local (privada)** — modelos Qwen 1.5B / 0.5B en GGUF servidos por un backend Python con FastAPI.
- 🎙️ **Transcripción de voz** — mensajes de audio transcritos con `faster-whisper` (Whisper).
- 📝 **Notas de dolor automáticas** — el modelo emite notas estructuradas (`###NOTAS###`) extraídas en tiempo real durante el streaming.
- 🩺 **Detección y clasificación de dolor** — bandera `es_dolor` a partir de la decisión de la IA más coincidencia de palabras clave.
- 🧾 **Conclusión y recomendación de IA** — generadas al final de cada conversación.
- 🔐 **Autenticación** — Firebase Auth (correo/contraseña) con registro.
- 🗃️ **Base de datos en tiempo real** — usuarios, conversaciones, notas y roles de administrador en Firebase RTDB.
- 👑 **Panel de superusuarios** — roles Admin, Vigilante y Boss con estadísticas e inspección de conversaciones.
- 🔔 **Notificaciones toast** — sistema global de notificaciones.
- 🌐 **Landing page** — página oficial de marketing con hero, características, testimonios y FAQ.

---

## Arquitectura

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
│  Firebase (nube)         │         │  Modelo local (tu equipo)     │
│  users / conversations / │         │  qwen2.5-*-q4_k_m.gguf        │
│  admins / notes          │         └───────────────────────────────┘
└──────────────────────────┘
```

- El **frontend** se comunica con **Firebase** para autenticación y persistencia.
- El **backend** se ejecuta localmente en `localhost:8000` y sirve el LLM mediante Server-Sent Events (SSE).
- Las respuestas en streaming también transportan **notas** estructuradas analizadas en tiempo real.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3, React Router 6, iconos Lucide |
| Backend | Python, FastAPI, Uvicorn, llama-cpp-python |
| Modelos ML | Qwen 2.5 1.5B / 0.5B (GGUF Q4_K_M), faster-whisper |
| Datos y Auth | Firebase Auth, Firebase Realtime Database |
| Despliegue | Build estático de Vite → Netlify (solo frontend) |

---

## Estructura del proyecto

```
PainHunter/
├── index.html
├── package.json
├── tailwind.config.js
├── .env                        # Variables de entorno Firebase del frontend (no se suben)
├── public/
│   └── img/                    # Logos e imágenes
├── server/
│   ├── app.py                  # Backend FastAPI (chat, transcribe, conclusion, title)
│   ├── requirements.txt
│   ├── start-ai.bat            # Lanzador de IA local con un clic (Windows)
│   ├── scripts/
│   │   └── download_model.py   # Descarga el modelo GGUF
│   └── models/                 # Archivos GGUF (descargados)
│       ├── qwen2.5-0.5b-instruct-q4_k_m.gguf
│       └── qwen2.5-1.5b-instruct-q4_k_m.gguf
└── src/
    ├── main.jsx                # Rutas y providers
    ├── firebase.js             # Inicialización de Firebase
    ├── index.css               # Tailwind + animaciones personalizadas
    ├── contexts/               # AuthContext, ToastContext
    ├── hooks/                  # useChat, usePageTitle, useReveal
    ├── services/               # chatService, adminService, firebaseService
    ├── pages/                  # LandingPage, AuthPage, SuperUserLogin, AdminPanel, App
    └── App.jsx                 # Aplicación principal de chat
```

---

## Primeros pasos

### Requisitos

- **Node.js** 18+ y npm
- **Python** 3.10+ (con `pip`)
- Un **proyecto de Firebase** con Auth (correo/contraseña) y Realtime Database habilitados

### 1. Clonar el repositorio

```bash
git clone <url-de-tu-repositorio>
cd PainHunter
```

### 2. Iniciar el servidor de IA local

> En Windows, solo haz doble clic en `server\start-ai.bat`. Crea un entorno virtual, instala dependencias, descarga el modelo (si falta) e inicia el servidor en `http://localhost:8000`.

```bash
cd server
python -m venv venv
venv\Scripts\activate          # Windows (o `source venv/bin/activate` en macOS/Linux)
pip install --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu "llama-cpp-python"
pip install -r requirements.txt
python scripts\download_model.py 0.5b   # o 1.5b
python app.py
```

Comprueba que el servidor esté activo:

```bash
curl http://localhost:8000/health
# → {"status": "ok"}
```

### 3. Configurar el frontend

Crea un archivo `.env` en la raíz del proyecto con tus credenciales de Firebase:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://tu-proyecto-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=1:...
VITE_FIREBASE_MEASUREMENT_ID=G-...
```

### 4. Ejecutar el frontend

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` y ya puedes conversar con Mr Hunter.

### 5. Compilar para producción

```bash
npm run build
```

El sitio estático se genera en la carpeta `dist/`.

---

## Endpoints del backend

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health` | Comprobación de estado |
| `POST` | `/api/chat/stream` | Chat en streaming (SSE). Devuelve fragmentos `content` y `notes` analizadas. |
| `POST` | `/api/transcribe` | Transcribe un archivo de audio subido (Whisper). |
| `POST` | `/api/conclusion` | Genera `{ content, es_dolor, recomendacion }` para una conversación. |
| `POST` | `/api/title` | Genera un título corto para la conversación. |

**Cuerpo de la petición `/api/chat/stream`**

```json
{
  "user_name": "Angello",
  "messages": [
    { "role": "user", "content": "Hola, últimamente me siento muy cansado." }
  ]
}
```

**Respuesta SSE**

```
data: {"content":"Entiendo, Angello..."}

data: {"content":"..."}

data: {"notes":["Lleva cansancio hace meses","Menciona dolores de cabeza"]}

data: [DONE]
```

**Respuesta de `/api/conclusion`**

```json
{
  "content": "El usuario, Angello, se encuentra en una situación de cansancio...",
  "es_dolor": true,
  "recomendacion": "Asegúrate de tomar descansos regulares..."
}
```

---

## Estructura de la base de datos (Firebase Realtime Database)

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

**Reglas de seguridad (resumen)**

- Los usuarios normales solo pueden leer/escribir su propio nodo `conversations/{uid}`.
- Los usuarios con rol en `admins/{uid}` pueden leer `users`, `conversations` y `admins`.

---

## Roles y superusuarios

| Rol | Permisos |
|---|---|
| **ADMIN** | Acceso completo al panel de administración y a todos los datos |
| **VIGILANTE** | Puede monitorear conversaciones |
| **BOSS** | Monitoreo de máximo nivel |

Los superusuarios inician sesión a través de la ruta dedicada `/superusers`. Un intento de inicio de sesión normal con una cuenta de superusuario se bloquea con una notificación toast que indica el acceso correcto.

---

## Cómo funciona la entrevista con IA

1. El usuario inicia una conversación con Mr Hunter.
2. Mr Hunter sigue un método estructurado: **apertura → exploración → profundización (5 porqués) → motivación → cierre**.
3. El modelo tiene la instrucción de responder siempre en español, en 1–3 frases y con **una sola pregunta a la vez**.
4. Cuando el usuario comparte detalles importantes, el modelo añade `###NOTAS###` seguido de una lista JSON — el backend las extrae en tiempo real y las guarda como **notas de dolor**.
5. Tras la conversación, `/api/conclusion` analiza los mensajes y produce:
   - **content** — la conclusión de la IA,
   - **es_dolor** — `true` si la conversación indica dolor/malestar (decisión de la IA o coincidencia de palabras clave),
   - **recomendacion** — una recomendación personalizada.
6. La conclusión, la clasificación de dolor y la recomendación se persisten en el nodo de la conversación.

---

## Despliegue

### Frontend (Netlify)

El frontend es un sitio estático de Vite y se despliega directamente en Netlify:

```bash
npm run build
```

- **Comando de compilación:** `npm run build`
- **Directorio de publicación:** `dist`

### Backend

> ⚠️ Netlify **no puede** ejecutar el backend de IA en Python (proceso persistente, modelo GGUF local, sin garantías de CPU/GPU).

Para que la IA funcione en producción tienes que alojar el backend FastAPI en otro lugar:

1. **Túnel (demo):** expón tu servidor local con Cloudflare Tunnel o ngrok y actualiza `API_URL` en `src/services/chatService.js`.
2. **Render / Railway:** despliega `server/` como servicio web (requiere ~2 GB de RAM o más para el modelo 1.5B).
3. **VPS:** un servidor pequeño (p. ej. Hetzner, Oracle Cloud Free) ejecutando `python app.py`.
4. **API de IA en la nube:** sustituye las llamadas a `llama_cpp` por la API de OpenAI / OpenRouter y elimina el backend Python por completo.

---

## Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_FIREBASE_API_KEY` | Clave de API web de Firebase |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación de Firebase |
| `VITE_FIREBASE_DATABASE_URL` | URL de Realtime Database |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto de Firebase |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de Storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID del remitente |
| `VITE_FIREBASE_APP_ID` | ID de la aplicación |
| `VITE_FIREBASE_MEASUREMENT_ID` | ID de medición |

> Todas las credenciales de Firebase se leen de `.env` (gitignored). **Nunca subas claves reales.**

---

## Solución de problemas

| Problema | Solución |
|---|---|
| `npm.ps1` bloqueado en PowerShell de Windows | Usa `npm.cmd run dev` en lugar de `npm run dev` |
| El chat responde muy lento | Cambia al modelo 0.5B o aumenta `max_tokens`; la inferencia en CPU es lenta por naturaleza |
| `Permission denied` en escrituras de la base de datos | Verifica que las reglas de Firebase permitan a los usuarios escribir su propio nodo `conversations/{uid}` |
| Cambios del backend no se aplican | Reinicia el servidor Python (`python app.py`) después de editar `app.py` |
| Fallo al descargar el modelo | Ejecuta de nuevo `python scripts\download_model.py 0.5b` o descarga el GGUF manualmente en `server/models/` |
| Errores CORS | Asegúrate de que `localhost:8000` esté permitido en la configuración CORS de `app.py` |

---

## Licencia

Este proyecto tiene fines educativos y de demostración. Los modelos **Qwen** están sujetos a su licencia original; consulta [QwenLM](https://github.com/QwenLM) para más detalles.
