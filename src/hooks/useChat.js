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
  const { user } = useAuth();
  const uid = user?.uid;
  const userName = user?.displayName || '';

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
      if (list) setConversations(list);
    });
  }, [uid]);

  const save = useCallback(
    (conversation) => {
      if (uid) saveConversation(uid, conversation).catch(() => {});
    },
    [uid]
  );

  const saveTimerRef = useRef(null);

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      conversations.forEach((c) => save(c));
    }, 800);
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
            ? { ...c, messages: [...c.messages, userMessage, assistantMessage] }
            : c
        )
      );

      const withUser = [...currentMessages, userMessage];
      assistantTextRef.current = '';

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
                      messages: c.messages.map((m) =>
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
            }
          },
          userName
        );
        const replyText = assistantTextRef.current.trim();
        if (replyText) {
          requestConclusion([...withUser, { role: 'assistant', content: replyText }], userName)
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
                  messages: c.messages.map((m) =>
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
    [renameConversation, userName]
  );

  return {
    conversations,
    activeConversationId: activeId,
    messages,
    notas: active?.notas || [],
    loading,
    title: active?.title || '',
    sendMessage,
    startNewChat,
    selectConversation,
    deleteConversation,
    renameConversation,
  };
}
