import { X } from 'lucide-react';

export default function AlertModal({ open, title = 'Aviso', message, onClose }) {
  if (!open || !message) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm animate-popIn rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm leading-snug text-slate-600">{message}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-brand-500 hover:to-brand-700"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
