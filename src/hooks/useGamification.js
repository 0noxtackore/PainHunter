import { useCallback, useEffect, useRef, useState } from 'react';
import {
  subscribeGamification,
  applyReward,
  backfillConversation,
  XP_PER_MESSAGE,
  XP_PAIN_BONUS,
  XP_CONVERSATION_BONUS,
  HUELLAS_PER_MESSAGE,
  HUELLAS_PAIN_BONUS,
  PAIN_KEYWORDS,
} from '../services/gamificationService';

export function useGamification(uid) {
  const [byConversation, setByConversation] = useState({});
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(null);
  const dataRef = useRef({});
  const readyRef = useRef(false);

  useEffect(() => {
    dataRef.current = {};
    setByConversation({});
    setReady(false);
    readyRef.current = false;
    if (!uid) return undefined;
    return subscribeGamification(uid, (map) => {
      dataRef.current = map || {};
      setByConversation(map || {});
      setReady(true);
      readyRef.current = true;
    });
  }, [uid]);

  const reward = useCallback(
    async (conversationId, payload) => {
      if (!uid || !conversationId) return null;
      const current = dataRef.current[conversationId] || null;
      const result = await applyReward(uid, conversationId, current, payload);
      dataRef.current = { ...dataRef.current, [conversationId]: result.data };
      setByConversation(dataRef.current);

      const newTrophies = [];
      for (const [id, ts] of Object.entries(result.data.trophies || {})) {
        if (!current?.trophies?.[id]) newTrophies.push(id);
      }

      setPending({ ...payload, newTrophies });
      setTimeout(() => setPending(null), 3500);
      return result;
    },
    [uid]
  );

  const backfillConversations = useCallback(
    async (conversations) => {
      if (!uid || !readyRef.current || !Array.isArray(conversations)) return;
      let changed = false;
      for (const conversation of conversations) {
        if (!conversation || !conversation.id) continue;
        if (dataRef.current[conversation.id]) continue;
        const data = await backfillConversation(uid, conversation.id, conversation);
        if (data) {
          dataRef.current = { ...dataRef.current, [conversation.id]: data };
          changed = true;
        }
      }
      if (changed) setByConversation(dataRef.current);
    },
    [uid]
  );

  const rewardMessage = useCallback(
    async (conversationId, content, options = {}) => {
      const text = String(content || '');
      const isPain = options.pain || PAIN_KEYWORDS.some((word) => text.toLowerCase().includes(word));
      const payload = {
        xp: XP_PER_MESSAGE + (isPain ? XP_PAIN_BONUS : 0),
        huellas: HUELLAS_PER_MESSAGE + (isPain ? HUELLAS_PAIN_BONUS : 0),
        messages: 1,
        ...(options.notes ? { painNotes: options.notes } : {}),
      };
      return reward(conversationId, payload);
    },
    [reward]
  );

  const rewardConversation = useCallback(
    async (conversationId, options = {}) => {
      return reward(conversationId, {
        xp: XP_CONVERSATION_BONUS,
        conversations: 1,
        painNotes: options.notes || 0,
        conclusionDone: true,
      });
    },
    [reward]
  );

  return {
    byConversation,
    gamification: byConversation,
    ready,
    pending,
    backfillConversations,
    rewardMessage,
    rewardConversation,
  };
}
