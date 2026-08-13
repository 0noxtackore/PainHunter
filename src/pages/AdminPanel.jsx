import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Brain,
  Briefcase,
  Building2,
  ChevronDown,
  Eye,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageSquare,
  Network,
  NotebookPen,
  Search,
  Shield,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { subscribeAllUsers, subscribeAllConversations } from '../services/adminService';

const ROLE_BADGES = {
  lider: 'bg-brand-600 text-white',
};

const ROLE_ICONS = {
  lider: 'Líder',
};

function firstName(name) {
  return (name || '').trim().split(/\s+/)[0] || '';
}

function formatDate(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleString('es', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function buildRoleDoc(chats) {
  const doc = { resumenes: [], tareas: [], herramientas: [], interacciones: [] };
  const pushUnique = (arr, value) => {
    const text = String(value || '').trim();
    if (text && !arr.some((item) => item.toLowerCase() === text.toLowerCase())) arr.push(text);
  };
  (Array.isArray(chats) ? chats : []).forEach((chat) => {
    if (chat.resumenRol) pushUnique(doc.resumenes, chat.resumenRol);
    (Array.isArray(chat.tareasPrincipales) ? chat.tareasPrincipales : []).forEach((value) =>
      pushUnique(doc.tareas, value)
    );
    (Array.isArray(chat.herramientas) ? chat.herramientas : []).forEach((value) =>
      pushUnique(doc.herramientas, value)
    );
    (Array.isArray(chat.interacciones) ? chat.interacciones : []).forEach((value) =>
      pushUnique(doc.interacciones, value)
    );
  });
  return doc;
}

function isImportantChat(chat) {
  return (
    chat.importante === true ||
    chat.esDolor === true ||
    (Array.isArray(chat.notas) && chat.notas.length > 0)
  );
}

export default function AdminPanel() {
  const { user, role, organizacion, logout } = useAuth();
  const [users, setUsers] = useState([]);

  usePageTitle('Panel de administración');
  const [conversationsByUser, setConversationsByUser] = useState({});
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [expandedChat, setExpandedChat] = useState(null);
  const [viewChat, setViewChat] = useState(null);
  const [showAllChats, setShowAllChats] = useState(false);

  useEffect(() => subscribeAllUsers(setUsers, organizacion), [organizacion]);
  useEffect(() => subscribeAllConversations(setConversationsByUser, organizacion), [organizacion]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  const totalChats = useMemo(
    () => Object.values(conversationsByUser).reduce((sum, list) => sum + (list?.length || 0), 0),
    [conversationsByUser]
  );

  const totalNotas = useMemo(
    () =>
      Object.values(conversationsByUser).reduce(
        (sum, list) =>
          sum +
          (list || []).reduce(
            (s, c) => s + (Array.isArray(c.notas) ? c.notas.length : 0) + (c.esDolor ? 1 : 0),
            0
          ),
        0
      ),
    [conversationsByUser]
  );

  const usuariosConDolor = useMemo(
    () =>
      users.filter((u) => {
        const chats = conversationsByUser[u.uid] || [];
        return chats.some((c) => (Array.isArray(c.notas) && c.notas.length > 0) || c.esDolor);
      }).length,
    [users, conversationsByUser]
  );

  const stats = [
    { label: 'Usuarios', value: users.length, icon: Users, accent: 'from-brand-500 to-brand-700', text: 'text-brand-600' },
    { label: 'Conversaciones', value: totalChats, icon: MessageSquare, accent: 'from-sky-500 to-sky-700', text: 'text-sky-600' },
    { label: 'Obstáculos', value: totalNotas, icon: NotebookPen, accent: 'from-red-500 to-red-700', text: 'text-red-600' },
    { label: 'Usuarios con observaciones', value: usuariosConDolor, icon: Activity, accent: 'from-amber-500 to-amber-700', text: 'text-amber-600' },
  ];

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900">
      <header className="flex h-16 shrink-0 items-center gap-3 bg-gradient-to-r from-brand-700 to-brand-900 px-4 shadow-md sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-white">Panel de administración</h1>
            {role && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  ROLE_BADGES[role] || 'bg-white/20 text-white'
                }`}
                title={ROLE_ICONS[role] || role}
              >
                {ROLE_ICONS[role] || role}
              </span>
            )}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-white/70">
          {organizacion && (
            <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-semibold text-white sm:inline-flex">
              <Building2 className="h-3.5 w-3.5" />
              {organizacion}
            </span>
          )}
          <span className="hidden items-center gap-1.5 md:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {user?.email}
          </span>
          <button
            onClick={logout}
            className="rounded-lg bg-white/10 px-2.5 py-1.5 font-medium text-white transition hover:bg-white/20"
          >
            Salir
          </button>
        </div>
      </header>

      <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:grid-cols-4 sm:px-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition hover:shadow-md"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.accent}`}
            >
              <stat.icon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className={`text-xl font-bold leading-tight ${stat.text}`}>{stat.value}</p>
              <p className="truncate text-[11px] text-slate-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 transition focus-within:border-brand-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-brand-500/15">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar usuario por nombre o correo…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-3 sm:p-6">
        {filteredUsers.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              {users.length === 0 ? (
                <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
              ) : (
                <Users className="h-6 w-6 text-slate-300" />
              )}
            </div>
            <p className="text-sm">{users.length === 0 ? 'Cargando usuarios…' : 'Sin resultados'}</p>
          </div>
        ) : (
          <div
            className={`mx-auto grid w-full items-start gap-3 sm:gap-4 ${
              filteredUsers.length === 1
                ? 'grid-cols-1'
                : 'max-w-5xl grid-cols-1 lg:grid-cols-2'
            }`}
          >
            {filteredUsers.map((profile) => {
              const chats = conversationsByUser[profile.uid] || [];
              const hasNotas = chats.some(
                (c) => (Array.isArray(c.notas) && c.notas.length > 0) || c.esDolor
              );
              const roleDoc = buildRoleDoc(chats);
              const hasRoleDoc =
                roleDoc.resumenes.length > 0 ||
                roleDoc.tareas.length > 0 ||
                roleDoc.herramientas.length > 0 ||
                roleDoc.interacciones.length > 0;
              const observaciones = [];
              chats.forEach((c) => {
                (Array.isArray(c.notas) ? c.notas : []).forEach((n) => {
                  const text = typeof n === 'string' ? n : n?.text;
                  if (text) observaciones.push({ text: String(text).trim(), chat: c });
                });
              });
              const isOpen = expandedUser === profile.uid;
              const importantChats = chats.filter(isImportantChat);
              const visibleChats = showAllChats ? chats : importantChats;

              return (
                <div
                  key={profile.uid}
                  className={`relative rounded-3xl rounded-tl-md border bg-white shadow-sm transition ${
                    isOpen
                      ? 'border-brand-200 shadow-md ring-1 ring-brand-500/10'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute -top-[7px] left-6 h-3.5 w-3.5 rotate-45 border-l border-t bg-white ${
                      isOpen ? 'border-brand-200' : 'border-slate-200'
                    }`}
                  />
                  <button
                    onClick={() => setExpandedUser(isOpen ? null : profile.uid)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50"
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white shadow-sm ${
                        hasNotas
                          ? 'from-red-500 to-red-700'
                          : 'from-brand-500 to-brand-700'
                      }`}
                    >
                      {firstName(profile.name || profile.email || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-sm font-semibold">
                        {profile.name || 'Sin nombre'}
                        {profile.cargo && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-200">
                            <Briefcase className="h-3 w-3" />
                            {profile.cargo}
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-slate-500">{profile.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {hasNotas && (
                        <span className="hidden items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 ring-1 ring-inset ring-red-200 sm:flex">
                          <Activity className="h-3 w-3" />
                          {chats.reduce(
                            (s, c) => s + (c.notas?.length || 0) + (c.esDolor ? 1 : 0),
                            0
                          )}{' '}
                          obstáculo{chats.reduce((s, c) => s + (c.notas?.length || 0) + (c.esDolor ? 1 : 0), 0) === 1 ? '' : 's'}
                        </span>
                      )}
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {chats.length} {chats.length === 1 ? 'chat' : 'chats'}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50/40">
                      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-2">
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                          <div className="flex items-center gap-2 border-b border-brand-100 bg-brand-50/70 px-4 py-2.5">
                            <Brain className="h-4 w-4 text-brand-700" />
                            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                              Información recopilada por la IA
                            </p>
                          </div>
                          {hasRoleDoc ? (
                            <div className="px-4 py-3">
                              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                                <Briefcase className="h-3.5 w-3.5" />
                                Documentación de rol
                              </p>
                              {roleDoc.resumenes.length > 0 && (
                                <p className="mb-2 text-sm leading-relaxed text-slate-700">
                                  {roleDoc.resumenes[roleDoc.resumenes.length - 1]}
                                </p>
                              )}
                              {roleDoc.tareas.length > 0 && (
                                <div className="mb-2">
                                  <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                    <ListChecks className="h-3.5 w-3.5" />
                                    Tareas principales
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {roleDoc.tareas.map((item) => (
                                      <span
                                        key={item}
                                        className="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-800 ring-1 ring-inset ring-brand-200"
                                      >
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {roleDoc.herramientas.length > 0 && (
                                <div className="mb-2">
                                  <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                    <Wrench className="h-3.5 w-3.5" />
                                    Herramientas
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {roleDoc.herramientas.map((item) => (
                                      <span
                                        key={item}
                                        className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700 ring-1 ring-inset ring-slate-200"
                                      >
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {roleDoc.interacciones.length > 0 && (
                                <div>
                                  <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                                    <Network className="h-3.5 w-3.5" />
                                    Colabora con
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {roleDoc.interacciones.map((item) => (
                                      <span
                                        key={item}
                                        className="rounded-full bg-sky-50 px-2.5 py-1 text-xs text-sky-800 ring-1 ring-inset ring-sky-200"
                                      >
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="px-4 py-8 text-center text-sm text-slate-400">
                              Aún no hay información sobre el rol de este usuario en sus entrevistas.
                            </div>
                          )}
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
                          <div className="flex items-center gap-2 border-b border-red-100 bg-red-50/70 px-4 py-2.5">
                            <NotebookPen className="h-4 w-4 text-red-600" />
                            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                              Observaciones
                            </p>
                            {observaciones.length +
                              chats.filter((c) => c.esDolor && !(Array.isArray(c.notas) && c.notas.length > 0))
                                .length >
                              0 && (
                              <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-600">
                                {observaciones.length +
                                  chats.filter((c) => c.esDolor && !(Array.isArray(c.notas) && c.notas.length > 0))
                                    .length}
                              </span>
                            )}
                          </div>
                          {observaciones.length > 0 ? (
                            <ul className="max-h-80 space-y-2 overflow-y-auto p-4">
                              {observaciones.map((obs, index) => (
                                <li
                                  key={index}
                                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                                >
                                  <p>{obs.text}</p>
                                  <p className="mt-1 text-[11px] font-medium text-red-500">
                                    {obs.chat.title || 'Sin título'} ·{' '}
                                    {formatDate(obs.chat.updatedAt || obs.chat.createdAt)}
                                  </p>
                                </li>
                              ))}
                              {chats
                                .filter((c) => c.esDolor && !(Array.isArray(c.notas) && c.notas.length > 0))
                                .map((c) => (
                                  <li
                                    key={`dolor-${c.id}`}
                                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                                  >
                                    <p>El usuario reportó un obstáculo en esta conversación.</p>
                                    <p className="mt-1 text-[11px] font-medium text-red-500">
                                      {c.title || 'Sin título'} ·{' '}
                                      {formatDate(c.updatedAt || c.createdAt)}
                                    </p>
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <div className="px-4 py-8 text-center text-sm text-slate-400">
                              Sin observaciones registradas.
                            </div>
                          )}
                        </section>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-white px-4 py-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Conversaciones
                        </p>
                        {chats.length > 0 && (
                          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 text-xs font-medium">
                            <button
                              onClick={() => setShowAllChats(false)}
                              className={`rounded-md px-2.5 py-1 transition ${
                                !showAllChats
                                  ? 'bg-white text-brand-700 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              Importantes ({importantChats.length})
                            </button>
                            <button
                              onClick={() => setShowAllChats(true)}
                              className={`rounded-md px-2.5 py-1 transition ${
                                showAllChats
                                  ? 'bg-white text-brand-700 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              Todas ({chats.length})
                            </button>
                          </div>
                        )}
                      </div>

                      {chats.length === 0 ? (
                        <p className="px-4 py-5 text-center text-sm text-slate-400">
                          Sin conversaciones aún.
                        </p>
                      ) : visibleChats.length === 0 ? (
                        <p className="px-4 py-5 text-center text-sm text-slate-400">
                          Ninguna conversación marcada como importante por la IA.
                        </p>
                      ) : (
                        visibleChats.map((chat) => {
                          const notas = Array.isArray(chat.notas) ? chat.notas : [];
                          const chatOpen = expandedChat === `${profile.uid}:${chat.id}`;
                          return (
                            <div
                              key={chat.id}
                              className="border-b border-slate-100 last:border-0"
                            >
                              <div className="flex items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white">
                                <button
                                  onClick={() =>
                                    setExpandedChat(chatOpen ? null : `${profile.uid}:${chat.id}`)
                                  }
                                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                >
                                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                                  <span className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2">
                                      <span className="truncate text-sm font-medium">
                                        {chat.title || 'Sin título'}
                                      </span>
                                      {chat.esDolor && (
                                        <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 ring-1 ring-inset ring-red-200">
                                          obstáculo
                                        </span>
                                      )}
                                      {!chat.esDolor && notas.length > 0 && (
                                        <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 ring-1 ring-inset ring-red-200">
                                          {notas.length}
                                        </span>
                                      )}
                                    </span>
                                    {chat.conclusion && (
                                      <span className="mt-0.5 flex items-start gap-1 text-xs text-slate-500">
                                        <Brain className="mt-0.5 h-3 w-3 shrink-0 text-brand-500" />
                                        <span className="line-clamp-2">{chat.conclusion}</span>
                                      </span>
                                    )}
                                    <span className="mt-0.5 block text-[11px] text-slate-400">
                                      {formatDate(chat.updatedAt || chat.createdAt)}
                                    </span>
                                  </span>
                                  <ChevronDown
                                    className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
                                      chatOpen ? 'rotate-180' : ''
                                    }`}
                                  />
                                </button>
                                <button
                                  onClick={() =>
                                    setViewChat({
                                      uid: profile.uid,
                                      userName: profile.name || profile.email || 'Usuario',
                                      chat,
                                    })
                                  }
                                  className="flex shrink-0 items-center gap-1 rounded-lg bg-gradient-to-r from-brand-600 to-brand-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:from-brand-500 hover:to-brand-600"
                                  title="Ver chat"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span className="hidden md:inline">Ver chat</span>
                                </button>
                              </div>

                              {chatOpen && (
                                <div className="space-y-3 px-4 py-4">
                                  {notas.length > 0 && (
                                    <div>
                                      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-600">
                                        <NotebookPen className="h-3.5 w-3.5" />
                                        Observaciones detectadas
                                      </p>
                                      <ul className="space-y-1.5">
                                        {notas.map((nota, index) => (
                                          <li
                                            key={index}
                                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                                          >
                                            {nota.text || nota}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Diagnóstico de la conversación
                                    </p>
                                    {chat.conclusion ? (
                                      <div className="overflow-hidden rounded-xl border border-brand-200 bg-white shadow-sm">
                                        <div className="flex items-center justify-between gap-2 bg-brand-50/80 px-3 py-2">
                                          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
                                            <Brain className="h-3.5 w-3.5" />
                                            Conclusión de la IA
                                          </p>
                                          {chat.esDolor ? (
                                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600 ring-1 ring-inset ring-red-200">
                                              Hay obstáculo
                                            </span>
                                          ) : (
                                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-600 ring-1 ring-inset ring-emerald-200">
                                              Sin obstáculo
                                            </span>
                                          )}
                                        </div>
                                        <p className="px-3 py-2.5 text-sm leading-relaxed text-slate-800">
                                          {chat.conclusion}
                                        </p>
                                        {chat.recomendacion && (
                                          <div className="border-t border-emerald-200/70 bg-emerald-50/50 px-3 py-2.5">
                                            <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                              <Lightbulb className="h-3.5 w-3.5" />
                                              Solución recomendada
                                            </p>
                                            <p className="text-sm leading-relaxed text-slate-700">
                                              {chat.recomendacion}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-4 text-center text-xs text-slate-400">
                                        Aún no hay conclusión para esta conversación. Se genera
                                        cuando el usuario continúa el chat.
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {viewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="flex h-[85vh] w-full max-w-2xl animate-popIn flex-col overflow-hidden rounded-2xl bg-slate-100 shadow-2xl">
            <div className="flex items-center gap-3 bg-gradient-to-r from-brand-700 to-brand-900 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold text-white">
                {(viewChat.userName || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{viewChat.userName}</p>
                <p className="truncate text-xs text-white/60">
                  {viewChat.chat.title || 'Sin título'}
                </p>
              </div>
              {Array.isArray(viewChat.chat.notas) && viewChat.chat.notas.length > 0 && (
                <span className="shrink-0 rounded-full bg-red-500/80 px-2.5 py-1 text-[11px] font-semibold text-white ring-1 ring-inset ring-red-300">
                  {viewChat.chat.notas.length} notas
                </span>
              )}
              <button
                onClick={() => setViewChat(null)}
                className="shrink-0 rounded-lg p-1.5 text-white/70 transition hover:bg-white/15 hover:text-white"
                aria-label="Cerrar chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {Array.isArray(viewChat.chat.messages) && viewChat.chat.messages.length > 0 ? (
                viewChat.chat.messages.map((message) => (
                  <div
                    key={message.id || Math.random()}
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                      message.role === 'user'
                        ? 'ml-auto rounded-br-md bg-gradient-to-r from-brand-600 to-brand-700 text-white'
                        : 'mr-auto rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200'
                    }`}
                  >
                    {message.content || ''}
                  </div>
                ))
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400">
                  <MessageSquare className="h-8 w-8" />
                  <p className="text-sm">Esta conversación no tiene mensajes.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
