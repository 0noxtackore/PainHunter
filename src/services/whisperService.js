import { pipeline } from '@huggingface/transformers';

const MODEL_ID = 'onnx-community/whisper-base';
let transcriberPromise = null;
let loadProgress = null;

export function getWhisperLoadProgress() {
  return loadProgress;
}

export function isWhisperLoaded() {
  return transcriberPromise !== null;
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

async function decodeAudioToFloat32(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext();
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer.getChannelData(0);
  } finally {
    audioContext.close().catch(() => {});
  }
}

export async function transcribeWithWhisper(audioData, language = 'es') {
  const transcriber = await loadWhisper();
  const samples = audioData instanceof Blob ? await decodeAudioToFloat32(audioData) : audioData;
  const result = await transcriber(samples, {
    language,
    task: 'transcribe',
    return_timestamps: false,
  });
  return (result?.text || '').trim();
}
