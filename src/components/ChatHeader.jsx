import { useEffect, useState } from 'react';
import Avatar from './Avatar';

function useServerStatus() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    fetch('http://localhost:8000/health', { signal: controller.signal })
      .then((response) => {
        if (!cancelled) setStatus(response.ok ? 'online' : 'offline');
      })
      .catch(() => {
        if (!cancelled) setStatus('offline');
      })
      .finally(() => clearTimeout(timer));

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return status;
}

export default function ChatHeader() {
  const status = useServerStatus();

  const dot = status === 'online' ? 'bg-emerald-500' : status === 'checking' ? 'bg-slate-300' : 'bg-amber-500';
  const label =
    status === 'checking'
      ? 'Conectando…'
      : status === 'online'
        ? 'IA local conectada'
        : 'Modo demo (sin IA)';

  return (
    <header className="hidden h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:flex sm:px-6">
      <Avatar />
      <div>
        <h1 className="text-sm font-semibold text-slate-900">Mr Hunter</h1>
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          {label}
        </p>
      </div>
      <div className="ml-auto hidden sm:block">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 ring-1 ring-inset ring-brand-100">
          PainHunter
        </span>
      </div>
    </header>
  );
}
