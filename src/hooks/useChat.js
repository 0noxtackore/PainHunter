import { useCallback, useEffect, useRef, useState } from 'react';
import { sendMessage as requestReply, generateTitle as requestTitle } from '../services/chatService';

const STORAGE_KEY = 'painhunter-conversations';

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

function loadConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return [];
}

export function useChat() {
  const [conversations, setConversations] = useState(loadConversations);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(false);

  const conversationsRef = useRef(conversations);
  const activeIdRef = useRef(activeId);
  const loadingRef = useRef(false);
  const activeStreamIdRef = useRef(null);
  const titledRef = useRef(new Set());

  conversationsRef.current = conversations;
  activeIdRef.current = activeId;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  const active = conversations.find((c) => c.id === activeId) || null;
  const messages = active?.messages || [];

  const startNewChat = useCallback(() => {
    const conversation = { id: createId(), title: '', messages: [], createdAt: Date.now() };
    setConversations((prev) => [conversation, ...prev]);
    setActiveId(conversation.id);
  }, []);

  const selectConversation = useCallback((id) => {
    setActiveId(id);
  }, []);

  const deleteConversation = useCallback((id) => {
    const remaining = conversationsRef.current.filter((c) => c.id !== id);
    setConversations(remaining);
    if (activeIdRef.current === id) {
      setActiveId(remaining[0]?.id ?? null);
    }
  }, []);

  const renameConversation = useCallback((id, title) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  }, []);

  const sendMessage = useCallback(async (content) => {
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

    if (!titledRef.current.has(conversationId)) {
      titledRef.current.add(conversationId);
      requestTitle(withUser)
        .then((t) => {
          if (t) renameConversation(conversationId, t);
        })
        .catch(() => {});
    }

    try {
      await requestReply(withUser, (token) => {
        if (activeStreamIdRef.current !== assistantMessage.id) return;
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
      });
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
  }, [renameConversation]);

  return {
    conversations,
    activeConversationId: activeId,
    messages,
    loading,
    title: active?.title || '',
    sendMessage,
    startNewChat,
    selectConversation,
    deleteConversation,
    renameConversation,
  };
}
