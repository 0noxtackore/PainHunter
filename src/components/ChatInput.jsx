import { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Send, Square } from 'lucide-react';
import { transcribeAudio } from '../services/chatService';
import { getWhisperLoadProgress } from '../services/whisperService';
import VoiceEqualizer from './VoiceEqualizer';

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [micError, setMicError] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(null);
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!downloadProgress) return;
    const timer = setInterval(() => {
      const progress = getWhisperLoadProgress();
      if (progress) setDownloadProgress(progress);
    }, 200);
    return () => clearInterval(timer);
  }, [downloadProgress]);

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const handleChange = (event) => {
    setValue(event.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  };

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  };

  const startRecording = async () => {
    setMicError('');
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMicError('No se pudo acceder al micrófono. Revisa los permisos del navegador.');
      return;
    }
    streamRef.current = stream;

    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = async () => {
      cleanupStream();
      setRecording(false);
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      if (blob.size === 0) return;

      setTranscribing(true);
      setDownloadProgress({ loaded: 0, total: 0, label: 'Preparando Whisper…' });
      try {
        const text = await transcribeAudio(blob);
        setValue((prev) => (prev ? `${prev} ${text}` : text));
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
        }
      } catch {
        setMicError('No se pudo transcribir la grabación.');
      } finally {
        setTranscribing(false);
        setDownloadProgress(null);
      }
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  };

  const handleMic = () => {
    if (recording) stopRecording();
    else startRecording();
  };

  const micDisabled = disabled || transcribing;
  const progressPercent =
    downloadProgress && downloadProgress.total > 0
      ? Math.round((downloadProgress.loaded / downloadProgress.total) * 100)
      : null;

  return (
    <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className={`flex items-end gap-2 rounded-2xl border bg-white p-2 shadow-sm transition focus-within:ring-4 ${
            recording
              ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-500/10'
              : 'border-slate-300 focus-within:border-brand-500 focus-within:ring-brand-500/10'
          }`}
        >
          <button
            type="button"
            onClick={handleMic}
            disabled={micDisabled}
            title={recording ? 'Detener grabación' : 'Grabar voz'}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-40 ${
              recording
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {transcribing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : recording ? (
              <Square className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>

          {recording ? (
            <div className="min-h-[42px] flex-1">
              <VoiceEqualizer stream={streamRef.current} active={recording} />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              rows={1}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje a Mr Hunter o graba tu voz…"
              className="max-h-40 min-h-[42px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none"
            />
          )}

          <button
            type="submit"
            disabled={disabled || !value.trim() || recording}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        {(recording || transcribing || micError || downloadProgress) && (
          <div className="mt-2 text-center text-xs text-slate-400">
            {recording && 'Grabando… pulsa el cuadrado para detener y transcribir.'}
            {transcribing && !downloadProgress && 'Transcribiendo tu voz…'}
            {transcribing && downloadProgress && (
              <div className="mx-auto flex max-w-xs flex-col items-center gap-1">
                <span className="text-xs">
                  {progressPercent !== null
                    ? `Descargando Whisper ${progressPercent}%…`
                    : 'Descargando Whisper…'}
                </span>
                {progressPercent !== null && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
                <span className="text-[10px] text-slate-400">
                  Solo la primera vez. Después queda guardado en el navegador.
                </span>
              </div>
            )}
            {micError && <span className="text-red-500">{micError}</span>}
          </div>
        )}
        <p className={`mt-2 text-center text-xs ${micError ? '' : 'text-slate-400'}`}>
          Mr Hunter puede cometer errores. Verifica la información importante.
        </p>
      </div>
    </div>
  );
}
