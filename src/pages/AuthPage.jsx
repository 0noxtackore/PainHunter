import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  HeartPulse,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { checkAccountRole } from '../services/adminService';
function AuthError({ message }) {
  const map = {
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/user-not-found': 'No existe una cuenta con este correo.',
    'auth/wrong-password': 'La contraseña es incorrecta.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/email-already-in-use': 'Ya existe una cuenta con este correo.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/too-many-requests': 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
    'auth/network-request-failed': 'Error de conexión. Revisa tu internet.',
  };
  return message ? (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600">
      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
      <span>{map[message.code] || message.message || 'Ha ocurrido un error. Inténtalo de nuevo.'}</span>
    </div>
  ) : null;
}

function Field({ label, children }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </div>
  );
}

const BRAND_FEATURES = [
  {
    icon: HeartPulse,
    title: 'Atención de dolor',
    text: 'Detectamos tus molestias y las registramos para tu seguimiento.',
  },
  {
    icon: MessageCircle,
    title: 'Conversa con Mr Hunter',
    text: 'Un entrevistador empático que te escucha sin juicios.',
  },
  {
    icon: ShieldCheck,
    title: '100% confidencial',
    text: 'Tu información es privada y segura, solo para ti.',
  },
];

export default function AuthPage({ mode }) {
  const { login, signup } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  usePageTitle(isRegister ? 'Crear cuenta' : 'Iniciar sesión');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    if (isRegister && !name.trim()) {
      setError({ message: 'Escribe tu nombre para crear la cuenta.' });
      return;
    }
    if (isRegister && !gender) {
      setError({ message: 'Selecciona tu género para personalizar tu saludo.' });
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (isRegister) {
        await signup(name.trim(), email.trim(), password, gender);
        navigate('/chat');
        return;
      }
      // Verifica primero si la cuenta es de superusuario, sin abrir sesión.
      const check = await checkAccountRole(email.trim(), password);
      if (check?.role) {
        notify(
          'Esta cuenta es de superusuario. Usa el acceso de superusuarios para entrar al panel.',
          'warning',
          8000
        );
        return;
      }
      if (check?.error) {
        setError({ message: 'Correo o contraseña incorrectos.' });
        return;
      }
      await login(email.trim(), password);
      navigate('/chat');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition shadow-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15';

  return (
    <div className="relative flex h-screen items-center justify-center overflow-hidden bg-white text-slate-900">
      <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-red-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-red-300/10 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-0 h-64 w-64 rounded-full bg-red-400/10 blur-3xl" />

      <div className="relative grid h-[calc(100vh-3rem)] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-brand-900/15 lg:grid-cols-5">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 p-8 lg:col-span-2 lg:flex">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-red-500/20 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-3">
              <img src="/img/logo_sidebar.png" alt="PainHunter" className="h-12 w-auto drop-shadow" />
            </div>
            <h2 className="mt-10 text-2xl font-bold leading-snug text-white">
              {isRegister
                ? 'Empieza tu camino hacia el bienestar'
                : 'Bienvenido de nuevo'}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              {isRegister
                ? 'Crea tu cuenta y conversa con Mr Hunter, tu entrevistador personal para entender y cuidar tu salud emocional y laboral.'
                : 'Continúa tu conversación con Mr Hunter y sigue tu seguimiento de dolor.'}
            </p>
          </div>

          <div className="relative space-y-4">
            {BRAND_FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <feature.icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{feature.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/60">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="relative flex items-center gap-2 text-xs text-white/50">
            <Sparkles className="h-3.5 w-3.5" />
            PainHunter · Cuidado emocional con IA
          </div>
        </aside>

        <div className="overflow-y-auto p-6 sm:p-10 lg:col-span-3">
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <img
              src="/img/logo.png"
              alt="PainHunter"
              className="w-full max-w-[200px] drop-shadow-sm"
            />
            <p className="mt-3 text-center text-sm text-slate-500">
              {isRegister
                ? 'Crea tu cuenta y empieza a conversar con Mr Hunter'
                : 'Inicia sesión para continuar tu conversación con Mr Hunter'}
            </p>
          </div>

          <div className="mx-auto max-w-md">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-lg shadow-brand-600/30">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight text-slate-900">
                  {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
                </h1>
                <p className="text-sm text-slate-500">
                  {isRegister ? 'Completa tus datos para empezar' : 'Accede con tu cuenta PainHunter'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {isRegister && (
                <Field label="Nombre">
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Tu nombre"
                      required
                      className={inputClass}
                    />
                  </div>
                </Field>
              )}

              {isRegister && (
                <Field label="Género">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'masculino', label: 'Hombre' },
                      { value: 'femenino', label: 'Mujer' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setGender(option.value)}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                          gender === option.value
                            ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm ring-2 ring-brand-500/25'
                            : 'border-slate-300 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50/40'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              <Field label="Correo electrónico">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    required
                    className={inputClass}
                  />
                </div>
              </Field>

              <Field label="Contraseña">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-brand-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              <AuthError message={error} />

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-800 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:from-brand-500 hover:to-brand-700 hover:shadow-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy
                  ? isRegister
                    ? 'Creando cuenta…'
                    : 'Verificando…'
                  : isRegister
                    ? 'Crear cuenta'
                    : 'Iniciar sesión'}
              </button>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-center text-sm text-slate-500">
                {isRegister ? '¿Ya tienes cuenta?' : '¿No tienes cuenta?'}{' '}
                <button
                  onClick={() => navigate(isRegister ? '/login' : '/register')}
                  className="font-semibold text-brand-600 transition hover:text-brand-700"
                >
                  {isRegister ? 'Inicia sesión' : 'Regístrate gratis'}
                </button>
              </p>
              {!isRegister && (
                <button
                  onClick={() => navigate('/superusers')}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-500 transition hover:border-brand-300 hover:bg-brand-50/50 hover:text-brand-700"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Acceso de superusuarios
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
