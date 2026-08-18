import { useCallback, useEffect, useRef, useState } from 'react';
import {
  sendMessage as requestReply,
  generateTitle as requestTitle,
  generateConclusion as requestConclusion,
} from '../services/chatService';
import {
  subscribeConversations,
  loadConversation,
  saveConversation,
  deleteConversation as deleteStoredConversation,
} from '../services/chatStorage';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from './useGamification';

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function createMessage(role, content, streaming = false) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    streaming,
    createdAt: new Date().toISOString(),
  };
}

export function useChat() {
  const { user, organizacion } = useAuth();
  const uid = user?.uid;
  const userName = user?.displayName || '';

  const {
    byConversation,
    gamification,
    pending,
    ready: gamificationReady,
    backfillConversations,
    rewardMessage,
    rewardConversation,
  } = useGamification(uid);

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(false);

  const conversationsRef = useRef(conversations);
  const activeIdRef = useRef(activeId);
  const loadingRef = useRef(false);
  const activeStreamIdRef = useRef(null);
  const titledRef = useRef(new Set());
  const loadedMessagesRef = useRef(new Set());
  const assistantTextRef = useRef('');

  conversationsRef.current = conversations;
  activeIdRef.current = activeId;

  useEffect(() => {
    if (!uid) {
      setConversations([]);
      setActiveId(null);
      return undefined;
    }
    return subscribeConversations(uid, (list) => {
      if (!list) return;
      setConversations(list);
      setActiveId((current) => {
        if (current && list.some((c) => c.id === current)) return current;
        const mostRecent = list[0];
        return mostRecent ? mostRecent.id : null;
      });
    });
  }, [uid]);

  const backfillTimerRef = useRef(null);
  useEffect(() => {
    if (backfillTimerRef.current) clearTimeout(backfillTimerRef.current);
    backfillTimerRef.current = setTimeout(() => {
      backfillConversations(conversations).catch(() => {});
    }, 800);
    return () => {
      if (backfillTimerRef.current) clearTimeout(backfillTimerRef.current);
    };
  }, [conversations, backfillConversations, gamificationReady]);

  const save = useCallback(
    (conversation) => {
      if (uid) saveConversation(uid, conversation).catch(() => {});
    },
    [uid]
  );

  const saveTimerRef = useRef(null);
  const lastSavedRef = useRef({});

  const snapshotOf = (conversation) => {
    if (!conversation) return null;
    return JSON.stringify({
      title: conversation.title || '',
      messages: conversation.messages || [],
      notas: conversation.notas || [],
      conclusion: conversation.conclusion || '',
      esDolor: conversation.esDolor || false,
      recomendacion: conversation.recomendacion || '',
      resumenRol: conversation.resumenRol || '',
      tareasPrincipales: conversation.tareasPrincipales || [],
      herramientas: conversation.herramientas || [],
      interacciones: conversation.interacciones || [],
      procesos: conversation.procesos || [],
      objetivos: conversation.objetivos || [],
      importante: conversation.importante || false,
    });
  };

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      conversations.forEach((conversation) => {
        if (!conversation) return;
        const snapshot = snapshotOf(conversation);
        if (lastSavedRef.current[conversation.id] === snapshot) return;
        lastSavedRef.current[conversation.id] = snapshot;
        save(conversation);
      });
    }, 1500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [conversations, save]);

  const active = conversations.find((c) => c.id === activeId) || null;
  const messages = active?.messages || [];

  const selectConversation = useCallback(
    async (id) => {
      setActiveId(id);
      if (!uid || loadedMessagesRef.current.has(id)) return;
      loadedMessagesRef.current.add(id);
      const stored = await loadConversation(uid, id).catch(() => null);
      if (stored && Array.isArray(stored.messages)) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, messages: stored.messages } : c))
        );
      }
    },
    [uid]
  );

  const startNewChat = useCallback(() => {
    const conversation = { id: createId(), title: '', messages: [], createdAt: Date.now() };
    setConversations((prev) => [conversation, ...prev]);
    setActiveId(conversation.id);
  }, []);

  const deleteConversation = useCallback(
    (id) => {
      const remaining = conversationsRef.current.filter((c) => c.id !== id);
      setConversations(remaining);
      if (activeIdRef.current === id) {
        setActiveId(remaining[0]?.id ?? null);
      }
      if (uid) deleteStoredConversation(uid, id).catch(() => {});
    },
    [uid]
  );

  const renameConversation = useCallback(
    (id, title) => {
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
    },
    [save]
  );

  const sendMessage = useCallback(
    async (content) => {
      const trimmed = typeof content === 'string' ? content.trim() : '';
      if (!trimmed || loadingRef.current) return;

      let conversationId = activeIdRef.current;
      if (!conversationId) {
        conversationId = createId();
        const conversation = { id: conversationId, title: '', messages: [], createdAt: Date.now() };
        setConversations((prev) => [conversation, ...prev]);
        setActiveId(conversationId);
      }

      loadingRef.current = true;
      setLoading(true);

      const currentMessages =
        conversationsRef.current.find((c) => c.id === conversationId)?.messages || [];
      const userMessage = createMessage('user', trimmed);
      const assistantMessage = createMessage('assistant', '', true);
      activeStreamIdRef.current = assistantMessage.id;

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? { ...c, messages: [...(Array.isArray(c.messages) ? c.messages : []), userMessage, assistantMessage] }
            : c
        )
      );

      const withUser = [...currentMessages, userMessage];
      assistantTextRef.current = '';

      rewardMessage(conversationId, trimmed, { notes: 0 }).catch(() => {});

      if (!titledRef.current.has(conversationId)) {
        titledRef.current.add(conversationId);
        requestTitle(withUser)
          .then((t) => {
            if (t) renameConversation(conversationId, t);
          })
          .catch(() => {});
      }

      try {
        await requestReply(
          withUser,
          (token) => {
            if (activeStreamIdRef.current !== assistantMessage.id) return;
            assistantTextRef.current += token;
            setConversations((prev) =>
              prev.map((c) =>
                c.id === conversationId
              ? {
                  ...c,
                  messages: (Array.isArray(c.messages) ? c.messages : []).map((m) =>
                    m.id === assistantMessage.id
                      ? { ...m, content: m.content + token, streaming: false }
                      : m
                  ),
                }
              : c
              )
            );
          },
          (notes) => {
            if (Array.isArray(notes) && notes.length > 0) {
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === conversationId
                    ? {
                        ...c,
                        notas: [...(c.notas || []), ...notes.map((text) => ({ text }))],
                      }
                    : c
                )
              );
              rewardConversation(conversationId, { notes: notes.length }).catch(() => {});
            }
          },
          userName,
          organizacion
        );
        const replyText = assistantTextRef.current.trim();
        if (replyText) {
          requestConclusion([...withUser, { role: 'assistant', content: replyText }], userName, organizacion)
            .then((result) => {
              if (result.content) {
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === conversationId
                      ? {
                          ...c,
                          conclusion: result.content,
                          esDolor: Boolean(result.esDolor),
                          recomendacion: result.recomendacion,
                          resumenRol: result.resumenRol || '',
                          tareasPrincipales: result.tareasPrincipales || [],
                          herramientas: result.herramientas || [],
                          interacciones: result.interacciones || [],
                          procesos: result.procesos || [],
                          objetivos: result.objetivos || [],
                          importante: Boolean(result.importante),
                        }
                      : c
                  )
                );
              }
            })
            .catch(() => {});
        }
      } catch {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: (Array.isArray(c.messages) ? c.messages : []).map((m) =>
                    m.id === assistantMessage.id
                      ? {
                          ...m,
                          content:
                            'Lo siento, no pude procesar tu mensaje en este momento. Por favor, inténtalo de nuevo.',
                          streaming: false,
                        }
                      : m
                  ),
                }
              : c
          )
        );
      } finally {
        activeStreamIdRef.current = null;
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [renameConversation, userName, organizacion, rewardMessage, rewardConversation]
  );

  const activeGamification = activeId ? byConversation[activeId] || null : null;

  return {
    conversations,
    activeConversationId: activeId,
    messages,
    notas: active?.notas || [],
    loading,
    title: active?.title || '',
    gamification: activeGamification,
    gamificationByConversation: byConversation,
    gamificationPending: pending,
    sendMessage,
    startNewChat,
    selectConversation,
    deleteConversation,
    renameConversation,
  };
}
