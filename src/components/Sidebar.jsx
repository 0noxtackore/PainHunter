import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Footprints, LogOut, MessageSquare, Pencil, Plus, Shield, Sparkles, Trash2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from './ConfirmModal';

export default function Sidebar({
  onNewChat,
  conversations,
  activeId,
  onSelect,
  onDelete,
  onRename,
  open,
  onClose,
  gamificationByConversation,
}) {
  const { user, logout, isAdmin, role, organizacion } = useAuth();
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const startEdit = (conversation) => {
    setEditingId(conversation.id);
    setDraft(conversation.title || '');
  };

  const commitEdit = () => {
    if (editingId) {
      onRename(editingId, draft.trim() || 'Sin título');
      setEditingId(null);
    }
  };

  const remove = () => {
    if (deleteTarget) onDelete(deleteTarget.id);
    setDeleteTarget(null);
  };

  const content = (
    <>
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
        <img
          src="/img/logo_sidebar.png"
          alt="PainHunter"
          className="mx-auto w-full max-w-[200px] object-contain"
        />
        <button
          onClick={onClose}
          aria-label="Cerrar menú"
          className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/10 hover:text-white md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
        >
          <Plus className="h-4 w-4" />
          Nuevo chat
        </button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
        {conversations.length > 0 ? (
          <>
            <p className="px-2 py-2 text-xs font-medium uppercase tracking-wide text-white/50">
              Conversaciones
            </p>
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group flex items-center gap-1 rounded-xl px-2 py-1.5 transition ${
                  conversation.id === activeId
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {editingId === conversation.id ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitEdit();
                      if (event.key === 'Escape') setEditingId(null);
                    }}
                    className="w-full rounded-md bg-white/90 px-2 py-1 text-sm text-slate-900 outline-none"
                  />
                ) : (
                  <button
                    onClick={() => onSelect(conversation.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    title={conversation.title || 'Sin título'}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-sm">
                      {conversation.title || 'Sin título'}
                    </span>
                  </button>
                )}
                {editingId !== conversation.id && (
                  <>
                    <div className="flex shrink-0 items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/80">
                      <Sparkles className="h-2.5 w-2.5 text-brand-300" />
                      {gamificationByConversation?.[conversation.id]?.xp || 0}
                    </div>
                    <div className="flex shrink-0 items-center gap-1 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-200">
                      <Footprints className="h-2.5 w-2.5" />
                      {gamificationByConversation?.[conversation.id]?.huellas || 0}
                    </div>
                    <div className="flex shrink-0 gap-0.5 opacity-0 transition group-hover:opacity-100">
                      <button
                        onClick={() => startEdit(conversation)}
                        title="Renombrar"
                        className="rounded p-1 hover:bg-white/20"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(conversation)}
                        title="Eliminar"
                        className="rounded p-1 hover:bg-white/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        ) : (
          <div className="mt-10 flex flex-col items-center gap-2 px-4 text-center">
            <MessageSquare className="h-5 w-5 text-white/40" />
            <p className="text-xs text-white/60">Sin conversaciones todavía</p>
            <p className="text-xs text-white/40">Inicia un chat con Mr Hunter</p>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 p-4">
        {user?.email && (
          <p className="mb-2 truncate text-center text-xs text-white/60" title={`${user.email} | ${user.displayName || ''}`}>
            {user.email}
            {user.displayName ? ` | ${user.displayName}` : ''}
          </p>
        )}
        {organizacion && (
          <p className="mb-2 truncate text-center text-xs font-medium text-brand-200" title={`Organización: ${organizacion}`}>
            {organizacion} - {role === 'lider' ? 'Líder' : 'Empleado'}
          </p>
        )}
        {isAdmin && (
          <button
            onClick={() => {
              navigate('/admin');
              onClose();
            }}
            className="mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Shield className="h-4 w-4" />
            Panel de administración
            <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
              {role === 'lider' ? 'Líder' : role}
            </span>
          </button>
        )}
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-white/60">
          <Sparkles className="h-3.5 w-3.5 text-white/80" />
          PainHunter : chat
        </p>
      </div>
    </>
  );

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-gradient-to-b from-brand-700 via-brand-800 to-brand-900 shadow-xl transition-transform duration-300 md:static md:z-auto md:shrink-0 md:translate-x-0 md:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>

      <ConfirmModal
        open={deleteTarget !== null}
        title="Eliminar conversación"
        message={
          deleteTarget
            ? `¿Seguro que quieres eliminar "${deleteTarget.title || 'Sin título'}"? Esta acción no se puede deshacer.`
            : ''
        }
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
