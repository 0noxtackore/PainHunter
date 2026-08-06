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
MODEL_PATH = os.path.join(BASE_DIR, "models", "qwen2.5-1.5b-instruct-q4_k_m.gguf")

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
    "No inventes datos ni consejos medicos: ofreces escucha, motivacion y claridad. "
    "\n\nPROHIBIDO: "
    "JAMAS digas frases como 'Lo siento, no puedo asistir con eso', 'No puedo ayudarte', "
    "'No puedo responder a eso' ni rechaces la conversacion por ningun motivo. Tu trabajo es "
    "escuchar, validar, motivar y ayudar a la persona aunque no entiendas bien lo que dice: "
    "reformula, pregunta con curiosidad y sigue apoyandola. Nunca termines la conversacion ni "
    "te des por vencido: siempre ofrece una pregunta o un siguiente paso. "
    "\n\nNOTAS: "
    "Al final de tu mensaje, si el usuario compartio algo importante que valga la pena recordar "
    "(un sentimiento clave, un dato concreto, un compromiso, un detalle de su problema), agrega "
    "exactamente esta linea final: ###NOTAS### y despues una lista JSON de frases cortas, ejemplo: "
    'Tu respuesta aqui. ###NOTAS### ["Le molesta la carga de trabajo", "Lleva 3 meses con cansancio"]. '
    "Es obligatorio agregar ###NOTAS### siempre que el usuario mencione datos como tiempo, nombres, "
    "sentimientos fuertes o detalles concretos de su problema. Si no hay nada, no lo agregues."
)


def build_system_prompt(user_name):
    name = (user_name or "").strip()
    if name:
        return SYSTEM_PROMPT + (
            f"\n\nEl usuario se llama {name}. Usa su nombre de forma natural al saludarlo, "
            f"cuando le des consejo o lo motives. No abuses de la repeticion del nombre: "
            f"utilizalo una o dos veces por mensaje como maximo."
        )
    return SYSTEM_PROMPT


def build_messages(request):
    """Incluye el prompt del sistema y recorta la historia por tokens para caber en la ventana."""
    system = build_system_prompt(request.user_name)
    history = list(request.messages)

    if len(history) <= 10000:
        candidates = history
    else:
        candidates = history[-10000:]
        if candidates[0]["role"] == "assistant":
            candidates = candidates[1:]

    budget = 30000  # tokens reservados para la historia (deja hueco para el prompt y la salida)
    messages = [{"role": "system", "content": system}]
    used = len(system) // 4

    for message in reversed(candidates):
        cost = len(message.get("content", "")) // 4 + 8
        if used + cost > budget:
            break
        messages.append(message)
        used += cost

    messages.reverse()
    return messages

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
            n_ctx=32768,
            n_threads=max(1, os.cpu_count() or 4),
            n_batch=512,
            flash_attn=False,
            verbose=False,
        )
    return _llm


class ChatRequest(BaseModel):
    messages: list[dict]
    user_name: str = ""


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
    messages = build_messages(request)

    result = llm.create_chat_completion(
        messages=messages,
        max_tokens=512,
        temperature=0.7,
        top_p=0.9,
    )
    content = result["choices"][0]["message"]["content"].strip()
    return ChatResponse(content=content)


class ConclusionResponse(BaseModel):
    content: str
    es_dolor: bool
    recomendacion: str = ""


@app.post("/api/conclusion", response_model=ConclusionResponse)
def conversation_conclusion(request: ChatRequest):
    llm = get_llm()
    name = (request.user_name or "").strip()
    lines = []
    for message in request.messages:
        role = message.get("role")
        content = (message.get("content") or "").strip()
        if role == "user" and content:
            lines.append(f"Usuario: {content}")
        elif role == "assistant" and content:
            lines.append(f"Sr. Hunter: {content}")
    text = "\n".join(lines)[-3000:]
    prompt = (
        "Basandote en la siguiente conversacion, escribe una CONCLUSION breve en espanol de "
        "MAXIMO 2 frases que resuma: el estado actual del usuario, el principal problema o tema "
        "que atraviesa y su avance. NO escribas dialogo, NO uses etiquetas de persona, NO te "
        "dirijas al usuario: responde directamente con la conclusion, sin comillas.\n\n"
    )
    if name:
        prompt += f"El usuario se llama {name}.\n\n"
    prompt += f"Conversacion:\n{text}\n\nConclusion:"
    result = llm.create_chat_completion(
        messages=[{"role": "user", "content": prompt}],
        max_tokens=128,
        temperature=0.3,
        top_p=0.9,
    )
    content = result["choices"][0]["message"]["content"].strip()
    content = re.sub(r"^(Conclusion|Conclusión)\s*:?\s*", "", content, flags=re.IGNORECASE)
    content = content.split("Solucion:")[0].split("Solución:")[0].strip()
    content = content.replace('"', "").strip()

    classify_prompt = (
        "Eres un evaluador clinico. Lee la siguiente CONCLUSION de una conversacion de apoyo. "
        "Decide si el usuario esta atravesando una situacion de dolor (fisico, emocional o "
        "agotamiento/estres que le afecta de forma significativa) que merezca ser registrada "
        "como nota de dolor para su seguimiento.\n\n"
        f"Conclusion: \"{content}\"\n\n"
        "Responde SI o NO."
    )
    classify = llm.create_chat_completion(
        messages=[{"role": "user", "content": classify_prompt}],
        max_tokens=8,
        temperature=0,
        top_p=1,
    )
    raw_answer = classify["choices"][0]["message"]["content"].strip()
    match = re.search(r"\b(SI|NO|SI\b|NO\b)", raw_answer.upper())
    ai_decision = bool(match and match.group(1).startswith("SI"))

    dolor_keywords = [
        "dolor", "duele", "cansancio", "agotamiento", "agotado", "estres", "estresado",
        "estresante", "fatiga", "insomnio", "sufre", "sufrimiento", "angustia", "ansiedad",
        "carga", "presion", "migrana", "cefalea",
    ]
    lower = content.lower()
    keyword_hit = any(keyword in lower for keyword in dolor_keywords)

    solution_prompt = (
        "Basandote en la siguiente conversacion y su conclusion, escribe una UNICA recomendacion "
        "practica y accionable en espanol, de MAXIMO 2 frases, que el usuario pueda aplicar hoy "
        "para mejorar su situacion. NO escribas dialogo, NO uses etiquetas de persona, NO te dirijas "
        "al usuario: responde directamente con la recomendacion, sin comillas.\n\n"
        f"Conclusion: \"{content}\"\n\n"
        f"Conversacion:\n{text}\n\nRecomendacion:"
    )
    solution = llm.create_chat_completion(
        messages=[{"role": "user", "content": solution_prompt}],
        max_tokens=96,
        temperature=0.4,
        top_p=0.9,
    )
    rec = solution["choices"][0]["message"]["content"].strip()
    rec = re.sub(r"^(Solucion|Solución|Recomendacion|Recomendación)\s*:?\s*", "", rec, flags=re.IGNORECASE)
    rec = re.sub(r"Usuario:.*?(?=Sr\. Hunter:|\Z)", "", rec, flags=re.IGNORECASE | re.DOTALL).strip()
    rec = re.sub(r"Sr\. Hunter:\s*", "", rec, flags=re.IGNORECASE).strip()
    rec = re.sub(r"\n+", " ", rec).strip()
    rec = rec.replace('"', "").strip()
    rec = rec[:280]

    return ConclusionResponse(
        content=content[:280],
        es_dolor=ai_decision or keyword_hit,
        recomendacion=rec,
    )


@app.post("/api/chat/stream")
def chat_stream(request: ChatRequest):
    llm = get_llm()
    messages = build_messages(request)

    def parse_notes(text):
        """Extrae la lista de notas desde el marcador ###NOTAS###."""
        marker = "###NOTAS###"
        if marker not in text:
            return None, text.strip()
        head, tail = text.split(marker, 1)
        tail = tail.strip()
        notes = []
        try:
            parsed = json.loads(tail)
            if isinstance(parsed, list):
                notes = [str(n).strip() for n in parsed if str(n).strip()]
            elif isinstance(parsed, dict):
                notes = [
                    str(v).strip()
                    for v in (parsed.get("notas") or [])
                    if str(v).strip()
                ]
        except (ValueError, TypeError):
            notes = [
                re.sub(r"^\s*[-*•\d.)]+\s*", "", line).strip()
                for line in re.split(r"[\n,;]+", tail)
                if re.sub(r"^\s*[-*•\d.)]+\s*", "", line).strip()
            ]
        return notes, head.strip()

    def fallback_notes():
        """Si el modelo no genero el marcador, extrae notas del ultimo mensaje del usuario."""
        last_user = ""
        for message in reversed(request.messages):
            if message.get("role") == "user":
                last_user = (message.get("content") or "").strip()
                break
        if len(last_user) < 15:
            return []
        sentences = re.split(r"[.!?\n]+", last_user)
        sentences = [s.strip() for s in sentences if len(s.strip()) >= 8]
        important = [
            "mes", "semana", "dias", "año", "anio", "tiempo", "jefe", "carga",
            "trabajo", "cansado", "agotado", "estres", "estresado", "presion",
            "presiona", "insomnio", "no duermo", "no descanso", "siempre", "nunca",
        ]
        return [s for s in sentences if any(word in s.lower() for word in important)][:4]

    def generate():
        stream = llm.create_chat_completion(
            messages=messages,
            max_tokens=96,
            temperature=0.6,
            top_p=0.85,
            stream=True,
        )
        marker = "###NOTAS###"
        buffer = ""
        notes_buffer = None
        for chunk in stream:
            delta = chunk["choices"][0]["delta"].get("content")
            if not delta:
                continue
            if notes_buffer is None:
                buffer += delta
                if marker in buffer:
                    head, tail = buffer.split(marker, 1)
                    if head:
                        yield f"data: {json.dumps({'content': head}, ensure_ascii=False)}\n\n"
                    notes_buffer = tail
                    buffer = ""
                else:
                    keep = marker[: len(marker) - 1]
                    if len(buffer) > len(keep):
                        safe = buffer[: -len(keep)]
                        if safe:
                            yield f"data: {json.dumps({'content': safe}, ensure_ascii=False)}\n\n"
                        buffer = buffer[-len(keep):]
            else:
                notes_buffer += delta
        if buffer:
            yield f"data: {json.dumps({'content': buffer}, ensure_ascii=False)}\n\n"
        if notes_buffer is not None:
            notes, _ = parse_notes("###NOTAS###" + notes_buffer)
        else:
            notes = fallback_notes()
        if notes:
            yield f"data: {json.dumps({'notes': notes}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000)
