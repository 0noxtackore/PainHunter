import { useEffect, useRef } from 'react';

const BAR_COUNT = 24;

export default function VoiceEqualizer({ stream, active }) {
  const barsRef = useRef([]);

  useEffect(() => {
    if (!active || !stream) return;

    let audioContext;
    let analyser;
    let rafId;
    const dataArray = new Uint8Array(BAR_COUNT);

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.65;
      source.connect(analyser);
    } catch {
      return;
    }

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      barsRef.current.forEach((bar, index) => {
        if (!bar) return;
        const value = dataArray[index] ?? 0;
        const height = Math.max(6, Math.round((value / 255) * 32));
        bar.style.height = `${height}px`;
      });
      rafId = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      audioContext.close().catch(() => {});
    };
  }, [stream, active]);

  if (!active) return null;

  return (
    <div className="flex h-9 w-full items-center justify-center gap-[3px] px-2">
      {Array.from({ length: BAR_COUNT }, (_, index) => (
        <span
          key={index}
          ref={(el) => {
            barsRef.current[index] = el;
          }}
          className="w-1 rounded-full bg-red-500"
          style={{ height: '6px', transition: 'height 60ms linear' }}
        />
      ))}
    </div>
  );
}
