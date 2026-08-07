import { useEffect, useState } from 'react';
import { NotebookPen } from 'lucide-react';
import Avatar from './Avatar';

function useServerStatus() {
  const [status, setStatus] = useState('online');

  useEffect(() => {
    const isLocal =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocal) {
      setStatus('online');
      return undefined;
    }

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

export default function ChatHeader({ notas }) {
  const status = useServerStatus();

  const dot = status === 'online' ? 'bg-emerald-500' : 'bg-amber-500';
  const label = status === 'online' ? 'En línea' : 'Reconectando…';

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
      <div className="ml-auto hidden items-center gap-2 sm:flex">
        {notas && notas.length > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
            <NotebookPen className="h-3.5 w-3.5" />
            {notas.length} {notas.length === 1 ? 'nota' : 'notas'}
          </div>
        )}
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 ring-1 ring-inset ring-brand-100">
          PainHunter
        </span>
      </div>
    </header>
  );
}
