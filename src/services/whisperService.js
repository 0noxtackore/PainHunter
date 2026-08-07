import { pipeline } from '@huggingface/transformers';

const MODEL_ID = 'Xenova/whisper-base';
const TARGET_RATE = 16000;
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

function resampleTo16k(input, sourceRate) {
  if (!sourceRate || sourceRate === TARGET_RATE) return input;
  const ratio = TARGET_RATE / sourceRate;
  const length = Math.round(input.length * ratio);
  const output = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const position = i / ratio;
    const index = Math.floor(position);
    const fraction = position - index;
    const left = input[index] || 0;
    const right = input[index + 1] || left;
    output[i] = left + (right - left) * fraction;
  }
  return output;
}

async function decodeAudioToFloat32(blob) {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContext();
  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const samples = audioBuffer.getChannelData(0);
    return resampleTo16k(samples, audioBuffer.sampleRate);
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
