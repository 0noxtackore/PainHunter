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
  Target,
  Users,
  Workflow,
  Wrench,
  X,
  UserPlus,
} from 'lucide-react';
import { ref, set } from 'firebase/database';
import { rtdb } from '../firebase';
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
  const doc = {
    resumenes: [],
    tareas: [],
    herramientas: [],
    interacciones: [],
    procesos: [],
    objetivos: [],
  };
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
    (Array.isArray(chat.procesos) ? chat.procesos : []).forEach((value) =>
      pushUnique(doc.procesos, value)
    );
    (Array.isArray(chat.objetivos) ? chat.objetivos : []).forEach((value) =>
      pushUnique(doc.objetivos, value)
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
  const [expandedChat, setExpandedChat] = useState(null);
  const [showAllChats, setShowAllChats] = useState(false);
  const [filterRole, setFilterRole] = useState('todos');
  const [viewChat, setViewChat] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => subscribeAllUsers(setUsers, organizacion), [organizacion]);
  useEffect(() => subscribeAllConversations(setConversationsByUser, organizacion), [organizacion]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = users;
    if (filterRole === 'obstaculo') {
      list = users.filter((u) => {
        const chats = conversationsByUser[u.uid] || [];
        return chats.some((c) => (Array.isArray(c.notas) && c.notas.length > 0) || c.esDolor === true);
      });
    } else if (filterRole !== 'todos') {
      list = users.filter((u) => (u.role || '').trim().toLowerCase() === filterRole);
    }
    if (!q) return list;
    return list.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
    );
  }, [users, search, filterRole]);

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

  const totalObstaculos = Object.values(conversationsByUser).reduce((s, arr) => s + (arr?.filter(c => c.esDolor === true).length || 0), 0);
  const totalSinObstaculos = Object.values(conversationsByUser).reduce((s, arr) => s + (arr?.filter(c => c.esDolor !== true).length || 0), 0);

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

      {/* Reportes y gráficos */}
      <div className="grid gap-4 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white px-4 py-5 sm:grid-cols-2 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="mb-3 text-sm font-bold text-slate-900">Conversaciones por empleado</h4>
            <div className="space-y-2">
              {(filteredUsers || []).length === 0 ? (
                <p className="text-xs text-amber-600" onClick={() => setFilterRole('todos')}>Ajusta filtros para ver perfiles.</p>
              ) : filteredUsers.slice(0, 8).map((u) => {
                const chats = conversationsByUser[u.uid]?.length || 0;
                const pct = Math.min(100, chats * 11);
                return (
                  <div key={u.uid} className="flex items-center gap-2 text-xs">
                    <span className="w-16 truncate text-slate-600">{u.name || '?'} </span>
                    <div className="h-3 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-700 transition-all duration-500" style={{ width: pct + '%' }} />
                    </div>
                    <span className="w-6 text-right font-semibold text-slate-700">{chats}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="mb-3 text-sm font-bold text-slate-900">Estado de conversaciones</h4>
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 rounded-full bg-gradient-to-tr from-red-500 via-amber-400 to-emerald-500 shadow-inner ring-2 ring-white" />
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-500 mr-1" /> Con obstáculos: <b className="text-red-600">{totalObstaculos}</b></div>
                <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 mr-1" /> Sin obstáculos: <b className="text-emerald-600">{totalSinObstaculos}</b></div>
              </div>
            </div>
          </div>
        </div>
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
        <div className="ml-3 flex shrink-0 items-center gap-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Rol</span>
          <button onClick={() => setFilterRole('todos')} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${filterRole === 'todos' ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Todos</button>
          <button onClick={() => setFilterRole('lider')} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${filterRole === 'lider' ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Líder</button>
          <button onClick={() => setFilterRole('empleado')} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${filterRole === 'empleado' ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Empleado</button>
          <button onClick={() => setFilterRole('obstaculo')} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${filterRole === 'obstaculo' ? 'bg-red-100 text-red-700 ring-1 ring-red-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Obstáculos</button>
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
                roleDoc.interacciones.length > 0 ||
                roleDoc.procesos.length > 0 ||
                roleDoc.objetivos.length > 0;
              const observaciones = [];
              chats.forEach((c) => {
                (Array.isArray(c.notas) ? c.notas : []).forEach((n) => {
                  const text = typeof n === 'string' ? n : n?.text;
                  if (text) observaciones.push({ text: String(text).trim(), chat: c });
                });
              });
              const importantChats = chats.filter(isImportantChat);
              const visibleChats = showAllChats ? chats : importantChats;

              return (
                <div
                  key={profile.uid}
                  onClick={() => setSelectedUser(profile)}
                  className={`relative cursor-pointer rounded-3xl rounded-tl-md border bg-gradient-to-br ${hasNotas ? 'from-red-50 to-white border-red-200' : 'from-white to-slate-50 border-slate-200'} shadow-sm transition hover:shadow-md hover:-translate-y-0.5`}
                >
                  <span
                    aria-hidden
                    className={`absolute -top-[7px] left-6 h-3.5 w-3.5 rotate-45 border-l border-t bg-white border-slate-200`}
                  />
                  <div
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
                        className="h-4 w-4 text-slate-400"
                      />
                    </div>
                  </div>
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

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm py-6 overflow-y-auto" onClick={() => setSelectedUser(null)}>
          <div className="mx-4 w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xl font-bold text-white shadow-lg shadow-brand-500/20">
                  {(selectedUser.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 leading-tight">{selectedUser.name}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-1">
                    <span>{selectedUser.email}</span><span>·</span><span className="font-semibold text-brand-600">{selectedUser.role || 'empleado'}</span><span>·</span><span>{selectedUser.organizacion || 'RRIntec'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{selectedUser.gender || '—'} · Creado: {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : '—'}</div>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-red-50 hover:text-red-500 transition" aria-label="Cerrar">✕</button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto pr-1 space-y-4">
              {/* Datos de usuario completos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="rounded-xl bg-slate-50 p-3"><span className="text-[10px] uppercase font-bold text-slate-400">Nombre</span><div className="font-semibold text-sm">{selectedUser.name || '—'}</div></div>
                <div className="rounded-xl bg-slate-50 p-3"><span className="text-[10px] uppercase font-bold text-slate-400">Rol</span><div className="font-semibold text-sm text-brand-700">{selectedUser.role || '—'}</div></div>
                <div className="rounded-xl bg-slate-50 p-3"><span className="text-[10px] uppercase font-bold text-slate-400">Organización</span><div className="font-semibold text-sm">{selectedUser.organizacion || '—'}</div></div>
                <div className="rounded-xl bg-slate-50 p-3"><span className="text-[10px] uppercase font-bold text-slate-400">Género</span><div className="font-semibold text-sm">{selectedUser.gender || '—'}</div></div>
                <div className="rounded-xl bg-slate-50 p-3 col-span-2"><span className="text-[10px] uppercase font-bold text-slate-400">Correo</span><div className="font-semibold text-sm">{selectedUser.email || '—'}</div></div>
                <div className="rounded-xl bg-slate-50 p-3"><span className="text-[10px] uppercase font-bold text-slate-400">UID</span><div className="font-mono text-xs">{selectedUser.uid || '—'}</div></div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="font-extrabold text-slate-900 flex items-center gap-2 mb-3"><MessageSquare className="h-4 w-4 text-brand-600" /> Conversaciones ({(conversationsByUser[selectedUser.uid] || []).length})</h4>
                {(conversationsByUser[selectedUser.uid] || []).length === 0 && <p className="text-sm text-slate-400">Sin conversaciones registradas.</p>}
              </div>

              {(conversationsByUser[selectedUser.uid] || []).map((chat, idx) => (
                <div key={chat.id || idx} className={`rounded-2xl border p-4 ${chat.esDolor ? 'border-red-200 bg-gradient-to-br from-red-50 to-white' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-bold text-slate-900">{chat.title || 'Entrevista'}</h5>
                      <span className="text-[11px] text-slate-400">{chat.createdAt ? new Date(chat.createdAt).toLocaleString() : '—'}</span>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold shadow-sm ${chat.esDolor ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{chat.esDolor ? 'Obstáculo detectado' : 'Sin obstáculos'}</span>
                  </div>

                  {/* Mensajes */}
                  <div className="mb-3 space-y-2">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400">Mensajes</span>
                    {(Array.isArray(chat.messages) && chat.messages.length > 0) ? chat.messages.map((m, mi) => (
                      <div key={m.id || mi} className={`rounded-xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-brand-50 text-brand-900 ml-auto max-w-[90%] text-right' : 'bg-slate-100 text-slate-800 max-w-[90%]'}`}>
                        <span className="text-[10px] font-bold opacity-60 block">{m.role === 'user' ? 'Usuario' : 'Asistente'}</span>
                        {m.content || '—'}
                      </div>
                    )) : <p className="text-xs text-slate-300">Sin mensajes.</p>}
                  </div>

                  {/* Notas */}
                  <div className="mb-3">
                    <span className="text-[10px] font-extrabold uppercase text-amber-500">Notas / Observaciones</span>
                    {(Array.isArray(chat.notas) && chat.notas.length > 0) ? chat.notas.map((n, ni) => (
                      <div key={ni} className="mt-1 rounded-lg bg-amber-50 border border-amber-100 px-2 py-1 text-xs text-amber-800">{n.text}</div>
                    )) : <p className="text-xs text-slate-300">Sin notas.</p>}
                  </div>

                  {/* Datos resumidos */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    {chat.conclusion && (<div className="rounded-lg bg-blue-50 px-2 py-1"><span className="font-bold text-blue-800">Conclusión:</span> {chat.conclusion}</div>)}
                    {chat.recomendacion && (<div className="rounded-lg bg-violet-50 px-2 py-1"><span className="font-bold text-violet-800">Recomendación:</span> {chat.recomendacion}</div>)}
                    {chat.resumenRol && (<div className="rounded-lg bg-slate-50 px-2 py-1"><span className="font-bold text-slate-700">Resumen rol:</span> {chat.resumenRol}</div>)}
                  </div>

                  {/* Listas */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {chat.tareasPrincipales && Array.isArray(chat.tareasPrincipales) && chat.tareasPrincipales.length > 0 && (<div><span className="font-bold text-slate-700">Tareas:</span> {chat.tareasPrincipales.join(', ')}</div>)}
                    {chat.herramientas && Array.isArray(chat.herramientas) && chat.herramientas.length > 0 && (<div><span className="font-bold text-slate-700">Herramientas:</span> {chat.herramientas.join(', ')}</div>)}
                    {chat.interacciones && Array.isArray(chat.interacciones) && chat.interacciones.length > 0 && (<div><span className="font-bold text-slate-700">Interacciones:</span> {chat.interacciones.join(', ')}</div>)}
                    {chat.procesos && Array.isArray(chat.procesos) && chat.procesos.length > 0 && (<div><span className="font-bold text-slate-700">Procesos:</span> {chat.procesos.join(', ')}</div>)}
                    {chat.objetivos && Array.isArray(chat.objetivos) && chat.objetivos.length > 0 && (<div><span className="font-bold text-slate-700">Objetivos:</span> {chat.objetivos.join(', ')}</div>)}
                    <div><span className="font-bold text-slate-700">Importante:</span> {chat.importante ? 'Sí' : 'No'}</div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setSelectedUser(null)} className="mt-6 w-full rounded-xl bg-brand-600 py-3 font-bold text-white shadow-lg shadow-brand-600/20 transition hover:bg-brand-700">Cerrar panel</button>
          </div>
        </div>
      )}
    </div>
  );
}
