import { Trash2 } from 'lucide-react';

export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-[popIn_200ms_ease-out]">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/50">
            <Trash2 className="h-5 w-5 text-red-500" />
          </span>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1.5 text-sm text-slate-500">{message}</p>

          <div className="mt-6 flex w-full gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
