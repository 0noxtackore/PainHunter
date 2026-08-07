import { useMemo, useState } from 'react';
import { Award, Footprints, Sparkles, X } from 'lucide-react';
import { levelFromXp, TROPHIES } from '../services/gamificationService';

function TrophiesModal({ open, trophies, onClose }) {
  if (!open) return null;
  const unlockedAt = trophies || {};

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[80vh] w-full max-w-md animate-popIn overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Award className="h-5 w-5 text-amber-500" />
            Trofeos
          </h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {TROPHIES.map((trophy) => {
            const unlocked = Boolean(unlockedAt[trophy.id]);
            return (
              <div
                key={trophy.id}
                className={`rounded-xl border p-3 transition ${
                  unlocked
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-slate-200 bg-slate-50 opacity-50'
                }`}
              >
                <div className="text-2xl">{unlocked ? trophy.icon : '🔒'}</div>
                <p className="mt-1 text-xs font-semibold text-slate-800">{trophy.name}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{trophy.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function GamificationBar({ gamification, pending }) {
  const [showTrophies, setShowTrophies] = useState(false);

  const progress = useMemo(() => {
    if (!gamification) return null;
    const { level, intoLevel, requiredForNext } = levelFromXp(gamification.xp || 0);
    return { level, intoLevel, requiredForNext };
  }, [gamification]);

  if (!gamification || !progress) return null;

  const pct = Math.min(100, Math.round((progress.intoLevel / progress.requiredForNext) * 100));
  const huellas = gamification.huellas || 0;
  const trophiesCount = Object.keys(gamification.trophies || {}).length;

  return (
    <>
      <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-2 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 ring-1 ring-inset ring-brand-100">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
            <span className="text-xs font-bold text-brand-700">Nv. {progress.level}</span>
          </div>
          <div className="flex-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {progress.intoLevel}/{progress.requiredForNext} XP · {gamification.xp || 0} XP totales
            </p>
          </div>
          <button
            onClick={() => setShowTrophies(true)}
            className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 ring-1 ring-inset ring-amber-100 transition hover:bg-amber-100"
            title="Ver trofeos"
          >
            <Award className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-xs font-semibold text-amber-700">{trophiesCount}</span>
          </button>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 ring-1 ring-inset ring-emerald-100">
            <Footprints className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-700">{huellas}</span>
          </div>
        </div>
      </div>

      {pending && (
        <div className="pointer-events-none fixed right-6 top-24 z-[100] animate-slideIn rounded-xl border border-brand-200 bg-white px-4 py-3 shadow-xl">
          <p className="text-xs font-semibold text-brand-700">
            +{pending.xp || 0} XP {pending.xp > 10 ? '✨' : ''}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-500">
            +{pending.huellas || 0} huellas {pending.painNotes ? '· nota de dolor registrada' : ''}
          </p>
        </div>
      )}

      <TrophiesModal
        open={showTrophies}
        trophies={gamification.trophies}
        onClose={() => setShowTrophies(false)}
      />
    </>
  );
}
