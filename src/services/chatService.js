import { streamReply, generateTitle, generateConclusion } from './openRouterService';
import { transcribeWithWhisper } from './whisperService';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getLastUserMessage(conversation) {
  for (let index = conversation.length - 1; index >= 0; index -= 1) {
    if (conversation[index].role === 'user') return conversation[index].content;
  }
  return '';
}

export async function sendMessage(conversation, onToken, onNotes, userName, organizacion) {
  let receivedAny = false;
  const wrappedToken = (token) => {
    receivedAny = true;
    onToken(token);
  };

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      await streamReply(conversation, wrappedToken, onNotes, userName, organizacion);
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
  throw new Error('El entrevistador (Mr Hunter) no pudo responder tras varios intentos. Inténtalo de nuevo en un momento.');
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
