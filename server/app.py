import json
import os
import re
import tempfile
import unicodedata

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from faster_whisper import WhisperModel
from llama_cpp import Llama

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "qwen2.5-0.5b-instruct-q4_k_m.gguf")

SYSTEM_PROMPT = (
    "Eres Mr Hunter, un entrevistador profesional, motivador y empatico que ayuda a empleados "
    "a expresar y entender sus problemas. Tu tono es cercano, respetuoso "
    "y sin juicios: primero escuchas y validas, luego haces UNA pregunta abierta a la vez. "
    "\n\nMETODO (en este orden): "
    "1) Apertura: saluda y explica que esto es un espacio seguro y confidencial para hablar de como se siente. "
    "2) Exploracion: indaga de forma tactil y comprensiva sobre estos temas: "
    "   a) dolor fisico o emocional que este sintiendo; "
    "   b) cansancio o agotamiento (fisico y mental); "
    "   c) problemas laborales (exigencias, ambiente, jefes, carga, falta de reconocimiento); "
    "   d) perdidas recientes (personas, proyectos, oportunidades, ilusiones); "
    "   e) enemistades o conflictos interpersonales (compaeros, superiores, familiares). "
    "   Empieza por el tema que la persona mencione y no fuerces todos. "
    "3) Profundizacion: usa la tecnica de los 5 porque: ante cada problema, pregunta que le causa, que le "
    "impide, desde cuando ocurre y como le afecta. "
    "4) Motivacion: reconoce su esfuerzo, normaliza sus emociones y destaca sus fortalezas. "
    "5) Cierre: resume lo que ha compartido, valida sus avances y ofrece un siguiente paso concreto. "
    "\n\nREGLAS: "
    "Responde SIEMPRE en espanol, entre 1 y 3 frases. Haz UNA sola pregunta por mensaje, nunca varias. "
    "Evita diagnosticar, etiquetar o minimizar. Si la persona menciona ideas de dano o crisis grave, "
    "responde con seriedad y recomienda buscar apoyo profesional de inmediato. "
    "No inventes datos ni consejos medicos: ofreces escucha, motivacion y claridad."
)

app = FastAPI(title="Mr Hunter - API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

_llm = None
_whisper = None


def get_whisper():
    global _whisper
    if _whisper is None:
        _whisper = WhisperModel(
            "base",
            device="cpu",
            compute_type="int8",
            cpu_threads=max(2, (os.cpu_count() or 4) - 1),
        )
    return _whisper


def get_llm():
    global _llm
    if _llm is None:
        if not os.path.exists(MODEL_PATH):
            raise RuntimeError(
                f"No se encontro el modelo en {MODEL_PATH}. "
                "Ejecuta primero scripts/download_model.py"
            )
        _llm = Llama(
            model_path=MODEL_PATH,
            n_ctx=1024,
            n_threads=max(1, os.cpu_count() or 4),
            n_batch=512,
            flash_attn=False,
            verbose=False,
        )
    return _llm


class ChatRequest(BaseModel):
    messages: list[dict]


class ChatResponse(BaseModel):
    content: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": os.path.basename(MODEL_PATH),
        "ready": _llm is not None,
    }


def clean_text(text):
    """Elimina caracteres corruptos, controles y normaliza la puntuacion."""
    text = unicodedata.normalize("NFC", text or "")
    text = text.replace("\ufffd", " ").replace("\u0000", " ")
    text = "".join(ch for ch in text if unicodedata.category(ch)[0] != "C")
    text = re.sub(r"[^\w\s¿¡.,;:!?áéíóúüñÁÉÍÓÚÜÑ()\-]", " ", text)
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"\s+([.,;:!?])", r"\1", text)
    text = re.sub(r"([.,;:!?])\1+", r"\1", text)
    return text.strip()


@app.post("/api/transcribe")
def transcribe(audio: UploadFile = File(...)):
    model = get_whisper()
    suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(audio.file.read())
        tmp_path = tmp.name
    try:
        segments, _info = model.transcribe(
            tmp_path, language="es", beam_size=3, vad_filter=True
        )
        raw = " ".join(segment.text.strip() for segment in segments).strip()
        return ChatResponse(content=clean_text(raw))
    finally:
        os.remove(tmp_path)


@app.post("/api/title", response_model=ChatResponse)
def conversation_title(request: ChatRequest):
    llm = get_llm()
    user_texts = [m["content"] for m in request.messages if m["role"] == "user"]
    text = " ".join(user_texts)[:800]
    prompt = (
        "Eres un asistente que pone titulos cortos y claros a conversaciones de apoyo emocional "
        "y laboral. Basandote en lo que el usuario cuenta, genera un titulo de MAXIMO 5 palabras "
        "en espanol, en minusculas y sin puntuacion. Solo responde con el titulo, nada mas.\n\n"
        f"Lo que el usuario ha contado: \"{text}\"\n\nTitulo:"
    )
    result = llm.create_chat_completion(
        messages=[{"role": "user", "content": prompt}],
        max_tokens=20,
        temperature=0.3,
        top_p=0.9,
    )
    content = result["choices"][0]["message"]["content"].strip().split("\n")[0]
    content = content[:60]
    return ChatResponse(content=content)


@app.post("/api/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    llm = get_llm()
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(request.messages)

    result = llm.create_chat_completion(
        messages=messages,
        max_tokens=512,
        temperature=0.7,
        top_p=0.9,
    )
    content = result["choices"][0]["message"]["content"].strip()
    return ChatResponse(content=content)


@app.post("/api/chat/stream")
def chat_stream(request: ChatRequest):
    llm = get_llm()
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(request.messages)

    def generate():
        stream = llm.create_chat_completion(
            messages=messages,
            max_tokens=64,
            temperature=0.6,
            top_p=0.85,
            stream=True,
        )
        for chunk in stream:
            delta = chunk["choices"][0]["delta"].get("content")
            if delta:
                yield f"data: {json.dumps({'content': delta}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
