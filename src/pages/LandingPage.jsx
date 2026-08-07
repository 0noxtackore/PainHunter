import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Brain,
  Check,
  ChevronDown,
  HeartPulse,
  Lock,
  Menu,
  MessageCircle,
  Quote,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useReveal } from '../hooks/useReveal';

const FEATURES = [
  {
    icon: MessageCircle,
    title: 'Conversa con Mr Hunter',
    text: 'Un entrevistador de clima laboral que te pregunta por tu día a día, detecta los obstáculos y los registra para el diagnóstico del equipo.',
  },
  {
    icon: Activity,
    title: 'Detecta el dolor del equipo',
    text: 'Identifica automáticamente cuellos de botella, fricciones y procesos pesados en cada conversación.',
  },
  {
    icon: Brain,
    title: 'IA local y privada',
    text: 'Tu información se procesa localmente. Ningún dato tuyo sale de tu dispositivo.',
  },
  {
    icon: Sparkles,
    title: 'Recomendaciones accionables',
    text: 'Recibe conclusiones y sugerencias concretas para mejorar tu trabajo al final de cada entrevista.',
  },
  {
    icon: ShieldCheck,
    title: '100% confidencial',
    text: 'Tus conversaciones son privadas y seguras. Solo tú tienes acceso a tu historial.',
  },
  {
    icon: HeartPulse,
    title: 'Notas de mejora automáticas',
    text: 'Cada obstáculo queda documentado con fecha, clasificación y evolución para el seguimiento del clima.',
  },
];

const STEPS = [
  {
    n: '01',
    icon: UserPlus,
    title: 'Crea tu cuenta',
    text: 'Regístrate en menos de un minuto con tu nombre y género. Sin costos ni complicaciones.',
  },
  {
    n: '02',
    icon: MessageCircle,
    title: 'Conversa con Mr Hunter',
    text: 'Cuéntale cómo es tu día a día laboral. Él te hará preguntas para entender tus obstáculos y oportunidades de mejora.',
  },
  {
    n: '03',
    icon: Sparkles,
    title: 'Revisa tus notas',
    text: 'Tus observaciones quedan registradas con una conclusión y una recomendación personalizada.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Ana M.',
    role: 'Empleada del área de operaciones',
    text: 'Me sorprende cómo Mr Hunter detecta los cuellos de botella de mi equipo sin que yo los detalle mucho. Se siente como una conversación real.',
  },
  {
    name: 'Carlos R.',
    role: 'Empleado del área de ventas',
    text: 'Finalmente alguien que escucha mis problemas de herramientas. Las recomendaciones al final de cada entrevista me han ayudado a trabajar mejor.',
  },
  {
    name: 'Lucía G.',
    role: 'Empleada del área de TI',
    text: 'Valoro muchísimo la privacidad. Saber que mi información no sale de mi dispositivo me da total confianza para hablar con franqueza.',
  },
];

const FAQS = [
  {
    q: '¿Qué es Mr Hunter?',
    a: 'Mr Hunter es tu entrevistador de clima laboral. Una IA que conversa contigo sobre tu día a día en el trabajo, detecta obstáculos, procesos pesados y fricciones, y te entrega conclusiones y recomendaciones al final de cada entrevista.',
  },
  {
    q: '¿Mis datos son privados?',
    a: 'Sí, absolutamente. Toda la conversación se procesa con una IA local en tu dispositivo. Ningún dato tuyo se envía a servidores externos.',
  },
  {
    q: '¿Cuánto cuesta?',
    a: 'Crear tu cuenta y conversar con Mr Hunter es completamente gratis. Mejorar el clima laboral no debería tener barreras.',
  },
  {
    q: '¿Cómo se registran mis observaciones?',
    a: 'Mr Hunter analiza cada conversación y detecta automáticamente los obstáculos que mencionas (herramientas, procesos, comunicación, carga de trabajo) y crea una nota de mejora para tu seguimiento.',
  },
];

export default function LandingPage() {
  usePageTitle('Bienvenido');
  useReveal();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navbar */}
      <header
        className={`sticky top-0 z-30 transition-all duration-300 ${
          scrolled
            ? 'border-b border-slate-200 bg-white/90 shadow-lg shadow-slate-900/5 backdrop-blur'
            : 'border-b border-transparent bg-white/80 backdrop-blur'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:h-20">
          <Link to="/" className="flex items-center gap-3">
            <img src="/img/logo.png" alt="PainHunter" className="h-14 w-auto" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <button onClick={() => scrollTo('features')} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              Beneficios
            </button>
            <button onClick={() => scrollTo('how')} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              Cómo funciona
            </button>
            <button onClick={() => scrollTo('testimonials')} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              Testimonios
            </button>
            <button onClick={() => scrollTo('faq')} className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
              Preguntas
            </button>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <Link
              to="/superusers"
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <Lock className="h-4 w-4" />
              Superusuarios
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-brand-800 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-700/25 transition hover:shadow-lg hover:shadow-brand-700/30"
            >
              <UserPlus className="h-4 w-4" />
              Registrarme
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Menú móvil */}
        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-4 pb-5 pt-3 shadow-xl lg:hidden">
            <div className="flex flex-col gap-1">
              {[
                { label: 'Beneficios', id: 'features' },
                { label: 'Cómo funciona', id: 'how' },
                { label: 'Testimonios', id: 'testimonials' },
                { label: 'Preguntas', id: 'faq' },
              ].map(({ label, id }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  {label}
                </button>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-brand-800 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <UserPlus className="h-4 w-4" />
                  Registrarme
                </Link>
                <Link
                  to="/superusers"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  <Lock className="h-4 w-4" />
                  Acceso de superusuarios
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-40 top-1/4 h-96 w-96 animate-blob rounded-full bg-red-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 animate-blob rounded-full bg-red-300/15 blur-3xl" style={{ animationDelay: '-6s' }} />
        <div className="pointer-events-none absolute right-1/3 top-0 h-64 w-64 animate-blob rounded-full bg-brand-500/15 blur-3xl" style={{ animationDelay: '-12s' }} />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="reveal">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
              <HeartPulse className="h-3.5 w-3.5" />
              Tu entrevistador de clima laboral
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Mr Hunter, tu{' '}
              <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
                cazador de dolores
              </span>{' '}
              del equipo
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 lg:text-lg">
              Una plataforma de entrevista laboral que conversa contigo sobre tu día a día en el
              trabajo, detecta los obstáculos que te frenan y te entrega conclusiones y
              recomendaciones para mejorar al final de cada conversación.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-brand-800 to-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-700/25 transition hover:shadow-xl hover:shadow-brand-700/35"
              >
                Empezar ahora
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <button
                onClick={() => scrollTo('how')}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Ver cómo funciona
              </button>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {[
                { v: '100%', l: 'Privado' },
                { v: '24/7', l: 'Disponible' },
                { v: '0$', l: 'Gratis' },
              ].map(({ v, l }) => (
                <div key={l} className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-center">
                  <dt className="text-2xl font-extrabold text-brand-700">{v}</dt>
                  <dd className="mt-0.5 text-xs font-medium uppercase tracking-wide text-slate-500">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Mockup de chat */}
          <div className="reveal relative hidden lg:block" style={{ animationDelay: '0.15s' }}>
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-brand-600/10 to-red-400/10 blur-2xl" />
            <div className="animate-float relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-brand-900/10">
              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-5 py-4">
                <div className="relative">
                  <div className="pulse-ring absolute inset-0 rounded-full bg-emerald-400" />
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-brand-500 text-white">
                    <User className="h-5 w-5" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">Mr Hunter</p>
                  <p className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    En línea
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
                  <Brain className="h-3 w-3" />
                  IA local
                </div>
              </div>
              <div className="space-y-3 px-5 py-6">
                <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-slate-100 px-4 py-2.5 text-sm text-slate-700">
                  Hola, soy Mr Hunter. ¿Qué es lo que más te frena en tu trabajo esta semana?
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-gradient-to-br from-brand-700 to-brand-500 px-4 py-2.5 text-sm text-white shadow-md shadow-brand-700/20">
                  Me faltan licencias de un software y las aprobaciones tardan días.
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-slate-100 px-4 py-2.5 text-sm text-slate-700">
                  Entiendo. Voy a registrar este obstáculo…
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-slate-100 px-4 py-3">
                  <span className="typing-dot h-2 w-2 rounded-full bg-brand-500" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-brand-500" />
                  <span className="typing-dot h-2 w-2 rounded-full bg-brand-500" />
                </div>
              </div>
            </div>

            <div className="absolute -bottom-5 -left-8 animate-float rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl" style={{ animationDelay: '-2s' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Obstáculo registrado</p>
                  <p className="text-[10px] text-slate-500">Hace un momento</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 top-10 animate-float rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-xl" style={{ animationDelay: '-4s' }}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <p className="text-xs font-bold text-emerald-700">Datos protegidos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="scroll-mt-20 border-t border-slate-100 bg-slate-50/60 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="reveal mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
              Beneficios
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Todo lo que necesitas para un mejor clima laboral
            </h2>
            <p className="mt-3 text-slate-600">
              PainHunter combina una IA local y privada con registro automático de obstáculos para
              mejorar cada día tu forma de trabajar.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }, i) => (
              <div
                key={title}
                className="reveal group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-700/10"
                style={{ transitionDelay: `${i * 30}ms` }}
              >
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-50 opacity-0 transition group-hover:opacity-100" />
                <div className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 transition duration-300 group-hover:bg-gradient-to-br group-hover:from-brand-800 group-hover:to-brand-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-brand-700/25">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="relative mt-4 text-base font-bold text-slate-900">{title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="how" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="reveal mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
              Proceso
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Cómo funciona
            </h2>
            <p className="mt-3 text-slate-600">Tres pasos simples para empezar a cuidarte.</p>
          </div>
          <div className="relative mt-14 grid gap-6 md:grid-cols-3">
            <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-0.5 bg-gradient-to-r from-brand-100 via-brand-300 to-brand-100 md:block" />
            {STEPS.map(({ n, icon: Icon, title, text }, i) => (
              <div
                key={n}
                className="reveal relative rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-700/10"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                  <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-100 to-red-100" />
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-800 to-brand-600 text-[11px] font-extrabold text-white shadow-md">
                    {n}
                  </span>
                  <Icon className="relative h-8 w-8 text-brand-700" />
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section id="testimonials" className="scroll-mt-20 border-t border-slate-100 bg-slate-50/60 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="reveal mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
              Testimonios
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Lo que dicen nuestros usuarios
            </h2>
            <p className="mt-3 text-slate-600">
              Empleados que ya mejoran su trabajo con la ayuda de Mr Hunter.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map(({ name, role, text }, i) => (
              <figure
                key={name}
                className="reveal relative rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-700/10"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <Quote className="h-8 w-8 text-brand-200" />
                <blockquote className="mt-3 text-sm leading-relaxed text-slate-600">{text}</blockquote>
                <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-brand-500 text-sm font-bold text-white">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500">{role}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5 text-brand-500">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <svg key={s} viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.364 1.118l1.286 3.958c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.784.57-1.838-.196-1.539-1.118l1.286-3.958a1 1 0 00-.364-1.118L2.05 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
                      </svg>
                    ))}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="reveal text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700">
              FAQ
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Preguntas frecuentes
            </h2>
            <p className="mt-3 text-slate-600">Resolvemos tus dudas antes de empezar.</p>
          </div>
          <div className="mt-12 space-y-3">
            {FAQS.map(({ q, a }, i) => {
              const open = openFaq === i;
              return (
                <div
                  key={q}
                  className={`reveal overflow-hidden rounded-2xl border transition-all duration-300 ${
                    open ? 'border-brand-200 bg-brand-50/40 shadow-md shadow-brand-700/5' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                  style={{ transitionDelay: `${i * 40}ms` }}
                >
                  <button
                    onClick={() => setOpenFaq(open ? -1 : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="text-sm font-bold text-slate-900">{q}</span>
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                        open ? 'rotate-180 bg-gradient-to-br from-brand-800 to-brand-600 text-white' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </button>
                  <div className={`grid transition-all duration-300 ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="reveal relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 px-6 py-16 text-center text-white shadow-2xl shadow-brand-900/25 sm:px-12">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 animate-blob rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 animate-blob rounded-full bg-red-500/25 blur-3xl" style={{ animationDelay: '-9s' }} />
          <div className="relative">
            <img src="/img/logo_sidebar.png" alt="PainHunter" className="mx-auto h-16 w-auto drop-shadow" />
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Empieza a mejorar tu trabajo hoy
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">
              Regístrate gratis y comienza a conversar con Mr Hunter. Tu privacidad está protegida
              en todo momento.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-brand-800 shadow-lg transition hover:bg-brand-50"
              >
                Crear mi cuenta gratis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Iniciar sesión
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-white/70">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-300" />
                Sin tarjeta de crédito
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-300" />
                Privacidad total
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-300" />
                Configuración en segundos
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3">
                <img src="/img/logo.png" alt="PainHunter" className="h-10 w-auto" />
              </div>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
                PainHunter · Mr Hunter, tu entrevistador de clima laboral. Conversa, detecta los
                obstáculos del equipo y mejora el trabajo con una IA local y privada.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Plataforma</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <button onClick={() => scrollTo('features')} className="text-slate-500 transition hover:text-brand-600">
                    Beneficios
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo('how')} className="text-slate-500 transition hover:text-brand-600">
                    Cómo funciona
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollTo('faq')} className="text-slate-500 transition hover:text-brand-600">
                    Preguntas frecuentes
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Acceso</h4>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <Link to="/login" className="text-slate-500 transition hover:text-brand-600">
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-slate-500 transition hover:text-brand-600">
                    Crear cuenta
                  </Link>
                </li>
                <li>
                  <Link to="/superusers" className="inline-flex items-center gap-1.5 text-slate-500 transition hover:text-brand-600">
                    <Lock className="h-3.5 w-3.5" />
                    Acceso de superusuarios
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} PainHunter · Todos los derechos reservados.
            </p>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              Hecho con
              <HeartPulse className="h-3.5 w-3.5 text-brand-500" />
              para tu trabajo
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
