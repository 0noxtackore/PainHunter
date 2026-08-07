import { pipeline } from '@huggingface/transformers';

const MODEL_ID = 'onnx-community/whisper-base';
let transcriberPromise = null;
let loadProgress = null;

export function getWhisperLoadProgress() {
  return loadProgress;
}

export function loadWhisper() {
  if (transcriberPromise) return transcriberPromise;
  loadProgress = { loaded: 0, total: 0, label: '' };
  transcriberPromise = pipeline('automatic-speech-recognition', MODEL_ID, {
    progress_callback: (progress) => {
      loadProgress = progress;
    },
  }).catch((error) => {
    transcriberPromise = null;
    loadProgress = null;
    throw error;
  });
  return transcriberPromise;
}

export function isWhisperLoaded() {
  return transcriberPromise !== null;
}

export async function transcribeWithWhisper(audioData, language = 'es') {
  const transcriber = await loadWhisper();
  const result = await transcriber(audioData, {
    language,
    task: 'transcribe',
    return_timestamps: false,
  });
  return (result?.text || '').trim();
}
