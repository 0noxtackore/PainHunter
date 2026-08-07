import { useEffect, useState } from 'react';
import Avatar from './Avatar';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeProfile } from '../services/profileService';

const suggestions = [
  'Me falta una herramienta para hacer mi trabajo',
  'Hay un proceso que se siente muy lento',
  'Tengo una fricción con mi equipo',
  'La carga de trabajo es demasiado alta',
];

function firstName(name) {
  return (name || '').trim().split(/\s+/)[0] || '';
}

export default function WelcomeScreen({ onPick }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user?.uid) return undefined;
    return subscribeProfile(user.uid, setProfile);
  }, [user?.uid]);

  const name = firstName(user?.displayName);
  const gender = profile?.gender || 'otro';

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-6 text-center">
      <span className="rounded-full ring-8 ring-brand-100">
        <Avatar size="lg" />
      </span>
      <h2 className="mt-5 text-xl font-semibold text-slate-900">
        {name
          ? gender === 'femenino'
            ? `Bienvenida, ${name}`
            : gender === 'masculino'
              ? `Bienvenido, ${name}`
              : `Bienvenido/a, ${name}`
          : 'Hola, soy Mr Hunter'}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
        Soy Mr Hunter, tu entrevistador de clima laboral. Quiero conocer cómo trabajas cada día:
        qué obstáculos te frenan, qué herramientas o procesos se sienten pesados y qué mejoras harían
        tu trabajo más fácil. Nada de lo que compartas es juzgado. ¿Qué te está costando hoy?
      </p>

      <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onPick(suggestion)}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-3.5 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:shadow-md"
          >
            {suggestion}
            <ArrowUpRight className="h-4 w-4 shrink-0 text-brand-400 transition group-hover:text-brand-500" />
          </button>
        ))}
      </div>
    </div>
  );
}
