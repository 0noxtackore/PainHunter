const API_URL = 'http://localhost:8000/api/chat/stream';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getLastUserMessage(conversation) {
  for (let index = conversation.length - 1; index >= 0; index -= 1) {
    if (conversation[index].role === 'user') return conversation[index].content;
  }
  return '';
}

function buildReply(conversation) {
  const text = getLastUserMessage(conversation).toLowerCase();

  if (/(hola|buenas|buenos días|buenas tardes|buenas noches)/.test(text)) {
    return 'Hola, gracias por estar aquí. Quiero que te sientas en confianza: este espacio es seguro y confidencial. Cuéntame, ¿cómo te has sentido últimamente: hay dolor, cansancio o algo en el trabajo que te esté pesando?';
  }

  if (/(quién eres|quien eres|qué eres|que eres|sobre ti)/.test(text)) {
    return 'Soy Mr Hunter, un entrevistador profesional y motivador. Estoy aquí para escucharte sin juicios y ayudarte a poner en palabras lo que sientes: dolor, cansancio, problemas en el trabajo, pérdidas o conflictos con personas. ¿Por cuál te gustaría empezar?';
  }

  if (/(pain point|punto de dolor|dolores|dolor)/.test(text)) {
    return 'Entiendo. El dolor puede ser físico o emocional, y ambos importan. Cuéntame con tus palabras: ¿qué dolor estás sintiendo ahora mismo, dónde lo sientes y desde cuándo?';
  }

  if (/(cansancio|agot|fatiga)/.test(text)) {
    return 'El cansancio que describes es real y tiene un origen. Quiero entenderlo mejor: ¿qué parte del día te agota más, y qué hace que ese agotamiento no mejore con el descanso?';
  }

  if (/(trabajo|empleo|jefe|oficina)/.test(text)) {
    return 'Gracias por compartir tu situación laboral. ¿Qué es lo que más te pesa de tu trabajo hoy: la carga, el ambiente, la relación con tu jefe o la falta de reconocimiento?';
  }

  if (/(perdi|pérdida|perdida|perder|duelo)/.test(text)) {
    return 'Lamento que estés pasando por eso. Las pérdidas duelen y es válido sentirlo. Si te sientes con fuerzas, cuéntame: ¿qué perdiste y cómo te ha afectado en tu día a día?';
  }

  if (/(conflicto|enemistad|discu|pelea|relación|relacion)/.test(text)) {
    return 'Los conflictos con otras personas son de las cosas que más desgastan. ¿Con quién tienes ese conflicto y qué es lo que más te molesta o te duele de esa situación?';
  }

  if (/(entrevista|preguntas|guía|guia)/.test(text)) {
    return 'Perfecto. Con una escucha atenta iremos paso a paso: primero conozco lo que sientes, luego profundizamos en lo que más te afecta y al final definimos un plan. Para empezar: ¿qué te está pesando más hoy, el dolor, el cansancio, el trabajo, alguna pérdida o un conflicto?';
  }

  if (/(funciona|qué es painhunter|que es painhunter|cómo funciona|como funciona)/.test(text)) {
    return 'PainHunter es un espacio para que hables conmigo, Mr Hunter, sobre lo que te pesa: dolor, cansancio, problemas laborales, pérdidas o conflictos. Con nuestra conversación podré ayudarte a aclarar tus ideas y dar pasos concretos. Cuéntame, ¿qué te trajo hasta aquí hoy?';
  }

  if (/(gracias|perfecto|genial|excelente|great)/.test(text)) {
    return 'Gracias a ti por confiar y compartir. Que lo que has dicho hoy te quede claro: estás dando un paso importante. Si quieres, podemos seguir profundizando o dejar aquí la sesión por hoy. ¿Cómo prefieres continuar?';
  }

  return 'Te escucho y no juzgo nada de lo que compartas: tu experiencia es válida. Cuéntame con tus palabras qué está pasando: ¿es un dolor o cansancio, algo del trabajo, una pérdida o un conflicto con alguien? Por ahí podemos empezar.';
}

async function streamFromServer(conversation, onToken) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversation }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Local AI respondió ${response.status}`);
    if (!response.body) throw new Error('Sin flujo de datos');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let separator;
      while ((separator = buffer.indexOf('\n\n')) !== -1) {
        const event = buffer.slice(0, separator);
        buffer = buffer.slice(separator + 2);
        const line = event.trim();
        if (!line.startsWith('data:')) continue;

        const payload = line.slice(5).trim();
        if (payload === '[DONE]') return;

        try {
          const data = JSON.parse(payload);
          if (data.content) onToken(data.content);
        } catch {
          /* evento ignorado */
        }
      }
    }
  } finally {
    clearTimeout(timer);
  }
}

export async function sendMessage(conversation, onToken) {
  try {
    await streamFromServer(conversation, onToken);
  } catch {
    await sleep(400);
    onToken(buildReply(conversation));
  }
}

export async function transcribeAudio(blob) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  try {
    const formData = new FormData();
    formData.append('audio', blob, 'audio.webm');
    const response = await fetch('http://localhost:8000/api/transcribe', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('transcribe failed');
    const data = await response.json();
    return data.content;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateTitle(conversation) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch('http://localhost:8000/api/title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conversation }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('title failed');
    const data = await response.json();
    return data.content;
  } catch {
    const text = getLastUserMessage(conversation).toLowerCase();
    if (/(cansancio|agotad|agotam|fatiga|agobiad)/.test(text)) return 'cansancio laboral';
    if (/(jefe|superior|manager)/.test(text)) return 'problemas con mi jefe';
    if (/(pérdida|perdida|perdí|fallecimiento|duelo)/.test(text)) return 'una pérdida reciente';
    if (/(enemistad|compañero|compañera|conflicto|pelea|discusión)/.test(text)) return 'conflicto con un compañero';
    if (/(estrés|estres|presión|presion)/.test(text)) return 'estrés y presión';
    return 'conversación de apoyo';
  } finally {
    clearTimeout(timer);
  }
}
