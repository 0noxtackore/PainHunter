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
    return greet('hola, gracias por tu tiempo. Esto es una entrevista breve y confidencial sobre tu día a día en el trabajo. Para empezar: ¿qué es lo que más te costó o te frenó esta semana en tus tareas?');
  }

  if (/(muchos problemas|tengo problemas|estoy mal|no sé qué hacer|no se que hacer)/.test(text)) {
    return greet('te escucho y quiero ayudarte a despejar eso. Parece que hay varios frentes abiertos. Dime cuál es el obstáculo que más te está frenando ahora mismo en tu trabajo y de ese empezamos, para no cargar todo de golpe.');
  }

  if (/(cansancio|agot|fatiga|cansa|agobiad)/.test(text)) {
    return greet('entendido. Ese agotamiento suele tener una causa concreta en el día a día. Cuéntame: ¿qué tarea o momento de la jornada te agota más, y qué crees que lo causa?');
  }

  if (/(trabajo|empleo|jefe|oficina|comput|pc|ordenador)/.test(text)) {
    return greet('gracias por compartirlo. Quiero entender mejor cómo se trabaja por ahí: ¿qué es lo que más te frena o te complica hoy: las herramientas, los procesos, la carga o la comunicación con tu jefe o el equipo?');
  }

  if (/(perdi|pérdida|perdida|perder|duelo)/.test(text)) {
    return greet('gracias por contármelo, y lamento que estés pasando por eso. En el contexto del trabajo: ¿de qué manera esta situación te está afectando tu concentración o tu desempeño estos días?');
  }

  if (/(conflicto|enemistad|discu|pelea|relación|relacion)/.test(text)) {
    return greet('las fricciones entre compañeros o áreas afectan mucho el flujo del trabajo. Cuéntame: ¿con quién o qué área se genera ese conflicto y en qué parte del proceso aparecen los roces?');
  }

  if (/(dolor|me duele)/.test(text)) {
    return greet('gracias por decírmelo. Quiero entender el impacto en tu trabajo: ¿ese malestar te está limitando alguna tarea o actividad específica estos días?');
  }

  if (/(gracias|perfecto|genial|excelente|great)/.test(text)) {
    return greet('gracias a ti por tu tiempo y tu franqueza. Lo que compartiste ayuda a entender mejor el clima del equipo. Si quieres, seguimos profundizando o cerramos aquí la entrevista por hoy. ¿Cómo prefieres continuar?');
  }

  if (/(quién eres|quien eres|qué eres|que eres|sobre ti)/.test(text)) {
    return 'Soy Mr Hunter, un entrevistador de clima laboral y procesos dentro de tu empresa. Estoy aquí para conocer cómo trabajas: qué obstáculos enfrentas, qué herramientas o procesos te frenan y qué mejoras crees que harían tu trabajo más fácil. ¿Por dónde quieres empezar?';
  }

  return greet('gracias por compartir. Quiero entender bien tu situación para ayudarte. Cuéntame con tus palabras: ¿qué es lo que más te está complicando o frenando en tu trabajo estos días, y desde cuándo?');
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
  } catch (error) {
    console.error('Whisper en navegador falló:', error);
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
