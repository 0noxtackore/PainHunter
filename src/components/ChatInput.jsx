import { useEffect, useRef, useState } from 'react';
import { Loader2, Mic, Send, Square } from 'lucide-react';
import { transcribeAudio } from '../services/chatService';
import { isSpeechRecognitionSupported, createSpeechRecognizer } from '../services/speechService';
import VoiceEqualizer from './VoiceEqualizer';

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('');
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [micError, setMicError] = useState('');
  const [interim, setInterim] = useState('');
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const finalTextRef = useRef('');

  const useBrowserSpeech = isSpeechRecognitionSupported();

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignorado */
        }
        recognitionRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

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
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignorado */
      }
      recognitionRef.current = null;
      setRecording(false);
      setInterim('');
      return;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  };

  const startBrowserRecording = () => {
    setMicError('');
    setInterim('');
    finalTextRef.current = '';
    const recognition = createSpeechRecognizer();
    if (!recognition) return;

    recognition.onresult = (event) => {
      let interimText = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';
        if (result.isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (finalText) finalTextRef.current += finalText;
      setInterim(interimText);
      const combined = (finalTextRef.current + interimText).trim();
      if (combined) setValue(combined);
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicError('No se pudo acceder al micrófono. Revisa los permisos del navegador.');
        setRecording(false);
        setInterim('');
      } else if (event.error === 'no-speech') {
        setRecording(false);
        setInterim('');
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setRecording(false);
      setInterim('');
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setRecording(true);
    } catch {
      setMicError('No se pudo iniciar el reconocimiento de voz.');
      recognitionRef.current = null;
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
      }
    };
    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
  };

  const handleMic = () => {
    if (recording) stopRecording();
    else if (useBrowserSpeech) startBrowserRecording();
    else startRecording();
  };

  const micDisabled = disabled || transcribing;
  const liveText = interim || (recording && finalTextRef.current ? finalTextRef.current : '');

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
              {useBrowserSpeech ? (
                <div className="flex h-full items-center gap-2 px-2">
                  {liveText ? (
                    <span className="line-clamp-2 text-sm text-slate-600">{liveText}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-red-500">
                      <span className="h-2 w-2 animate-ping rounded-full bg-red-500" />
                      Escuchando…
                    </span>
                  )}
                </div>
              ) : (
                <VoiceEqualizer stream={streamRef.current} active={recording} />
              )}
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
        {(recording || transcribing || micError) && (
          <p className={`mt-2 text-center text-xs ${micError ? 'text-red-500' : 'text-slate-400'}`}>
            {recording && !useBrowserSpeech && 'Grabando… pulsa el cuadrado para detener y transcribir.'}
            {recording && useBrowserSpeech && 'Hablando… pulsa el cuadrado para detener.'}
            {transcribing && 'Transcribiendo tu voz…'}
            {micError && micError}
          </p>
        )}
        <p className={`mt-2 text-center text-xs ${micError ? '' : 'text-slate-400'}`}>
          Mr Hunter puede cometer errores. Verifica la información importante.
        </p>
      </div>
    </div>
  );
}
