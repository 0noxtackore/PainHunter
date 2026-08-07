import { streamReply, generateTitle, generateConclusion } from './openRouterService';
import { transcribeWithWhisper } from './whisperService';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getLastUserMessage(conversation) {
  for (let index = conversation.length - 1; index >= 0; index -= 1) {
    if (conversation[index].role === 'user') return conversation[index].content;
  }
  return '';
}

function buildReply(conversation, userName) {
  const text = getLastUserMessage(conversation).toLowerCase();
  const name = (userName || '').trim().split(/\s+/)[0];

  const greet = (body) => (name ? `${name}, ${body}` : body);

  if (/(hola|buenas|buenos días|buenas tardes|buenas noches)/.test(text)) {
    return greet('hola, gracias por estar aquí. Quiero que te sientas en confianza: este espacio es seguro y confidencial. Cuéntame, ¿cómo te has sentido últimamente: hay dolor, cansancio o algo en el trabajo que te esté pesando?');
  }

  if (/(muchos problemas|tengo problemas|estoy mal|no sé qué hacer|no se que hacer)/.test(text)) {
    return greet('te escucho y quiero ayudarte. Cuando dices que tienes muchos problemas, me imagino que te sientes abrumado. Respira un momento y dime: ¿cuál es el problema que más te pesa ahora mismo? De ese empezamos. Así no cargamos todo de golpe.');
  }

  if (/(cansancio|agot|fatiga|cansa|agobiad)/.test(text)) {
    return greet('el cansancio que describes es real y tiene un origen. Quiero entenderlo mejor: ¿qué parte del día te agota más, y qué hace que ese agotamiento no mejore con el descanso?');
  }

  if (/(trabajo|empleo|jefe|oficina|comput|pc|ordenador)/.test(text)) {
    return greet('gracias por compartirlo. Ese ritmo con tantas tareas desgasta física y mentalmente. Dime: ¿qué es lo que más te pesa de tu jornada hoy: la carga, el ambiente, la relación con tu jefe o la falta de descanso?');
  }

  if (/(perdi|pérdida|perdida|perder|duelo)/.test(text)) {
    return greet('lamento que estés pasando por eso. Las pérdidas duelen y es válido sentirlo. Si te sientes con fuerzas, cuéntame: ¿qué perdiste y cómo te ha afectado en tu día a día?');
  }

  if (/(conflicto|enemistad|discu|pelea|relación|relacion)/.test(text)) {
    return greet('los conflictos con otras personas son de las cosas que más desgastan. ¿Con quién tienes ese conflicto y qué es lo que más te molesta o te duele de esa situación?');
  }

  if (/(dolor|me duele)/.test(text)) {
    return greet('el dolor puede ser físico o emocional, y ambos importan. Cuéntame con tus palabras: ¿qué dolor estás sintiendo ahora mismo, dónde lo sientes y desde cuándo?');
  }

  if (/(gracias|perfecto|genial|excelente|great)/.test(text)) {
    return greet('gracias a ti por confiar y compartir. Que lo que has dicho hoy te quede claro: estás dando un paso importante. Si quieres, podemos seguir profundizando o dejar aquí la sesión por hoy. ¿Cómo prefieres continuar?');
  }

  if (/(quién eres|quien eres|qué eres|que eres|sobre ti)/.test(text)) {
    return 'Soy Mr Hunter, un entrevistador profesional y motivador. Estoy aquí para escucharte sin juicios y ayudarte a poner en palabras lo que sientes: dolor, cansancio, problemas en el trabajo, pérdidas o conflictos con personas. ¿Por cuál te gustaría empezar?';
  }

  return greet('te escucho y no juzgo nada de lo que compartas: tu experiencia es válida. Cuéntame con tus palabras qué está pasando: ¿es un dolor o cansancio, algo del trabajo, una pérdida o un conflicto con alguien? Por ahí podemos empezar.');
}

export async function sendMessage(conversation, onToken, onNotes, userName) {
  let receivedAny = false;
  const wrappedToken = (token) => {
    receivedAny = true;
    onToken(token);
  };

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await streamReply(conversation, wrappedToken, onNotes, userName);
      return;
    } catch {
      if (receivedAny) return;
      if (attempt === 1) {
        await sleep(600);
        continue;
      }
    }
  }

  await sleep(400);
  onToken(buildReply(conversation, userName));
}

export async function transcribeAudio(blob) {
  try {
    const text = await transcribeWithWhisper(blob);
    if (text) return text;
  } catch {
    /* fallback al backend local */
  }

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

export async function getLastMessageContent(conversation) {
  return getLastUserMessage(conversation);
}

export { generateTitle, generateConclusion };
