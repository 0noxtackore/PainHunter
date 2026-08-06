import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Bell, CheckCircle2, Info, ShieldAlert, X } from 'lucide-react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback(
    (message, options = {}) => {
      const id = ++idCounter;
      const { type = 'info', duration = 5000 } = options;
      setToasts((current) => [...current, { id, message, type }]);
      if (duration) {
        timers.current[id] = setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss]
  );

  const notify = useCallback(
    (message, type = 'info', duration = 5000) => push(message, { type, duration }),
    [push]
  );

  return (
    <ToastContext.Provider value={{ notify, dismiss }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-sm animate-slideIn items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800">
              {toast.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-white" />
              ) : toast.type === 'warning' ? (
                <ShieldAlert className="h-4 w-4 text-white" />
              ) : (
                <Info className="h-4 w-4 text-white" />
              )}
            </span>
            <p className="flex-1 pt-1 text-sm leading-snug text-slate-700">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return context;
}
