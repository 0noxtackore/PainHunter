import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { getRole } from '../services/adminService';

function AuthError({ message }) {
  return message ? (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600">
      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
      <span>{message}</span>
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

const ROLES = [
  { label: 'Administrador', dot: 'bg-red-500' },
  { label: 'Vigilante', dot: 'bg-amber-500' },
  { label: 'Jefe', dot: 'bg-slate-800' },
];

export default function SuperUserLogin() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  usePageTitle('Acceso superusuarios');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const credentials = await login(email.trim(), password);
      const uid = credentials?.user?.uid;
      if (!uid) {
        setError({ message: 'Cuenta no encontrada.' });
        setBusy(false);
        return;
      }
      const userRole = await getRole(uid);
      if (userRole) {
        navigate('/admin');
      } else {
        setError({
          message: 'Esta cuenta no tiene permisos de superusuario. Accede desde el login normal.',
        });
        await logout();
      }
    } catch (err) {
      const map = {
        'auth/invalid-email': 'El correo electrónico no es válido.',
        'auth/user-not-found': 'No existe una cuenta con este correo.',
        'auth/wrong-password': 'La contraseña es incorrecta.',
        'auth/invalid-credential': 'Correo o contraseña incorrectos.',
        'auth/network-request-failed': 'Error de conexión. Revisa tu internet.',
      };
      setError({ message: map[err.code] || 'Correo o contraseña incorrectos.' });
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
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-600/30 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-red-500/25 blur-3xl" />

          <div className="relative">
            <img
              src="/img/logo_sidebar.png"
              alt="PainHunter"
              className="h-12 w-auto drop-shadow"
            />
            <h2 className="mt-10 text-2xl font-bold leading-snug text-white">Acceso superusuarios</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Área restringida para administradores, vigilantes y jefes con acceso al panel de
              seguimiento de todos los usuarios.
            </p>
          </div>

          <div className="relative">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/50">
              Roles autorizados
            </p>
            <div className="space-y-2.5">
              {ROLES.map((role) => (
                <div key={role.label} className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 rounded-full ${role.dot}`} />
                  <span className="text-sm text-white/80">{role.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center gap-2 text-xs text-white/50">
            <ShieldAlert className="h-3.5 w-3.5" />
            El acceso queda registrado para auditoría
          </div>
        </aside>

        <div className="overflow-y-auto p-6 sm:p-10 lg:col-span-3">
          <button
            onClick={() => navigate('/login')}
            className="mb-6 flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </button>

          <div className="mx-auto max-w-md">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-lg shadow-brand-600/30">
                <UserCog className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-tight text-slate-900">Iniciar sesión</h1>
                <p className="text-sm text-slate-500">Como miembro del equipo de PainHunter</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Field label="Correo electrónico">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="super-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="correo@painhunter.com"
                    required
                    className={inputClass}
                  />
                </div>
              </Field>

              <Field label="Contraseña">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="super-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Tu contraseña"
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

              <AuthError message={error?.message} />

              <button
                type="submit"
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-800 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:from-brand-500 hover:to-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? 'Verificando…' : 'Entrar al panel'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
