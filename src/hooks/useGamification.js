import { useCallback, useEffect, useRef, useState } from 'react';
import {
  subscribeGamification,
  applyReward,
  initGamification,
  XP_PER_MESSAGE,
  XP_PAIN_BONUS,
  XP_CONVERSATION_BONUS,
  HUELLAS_PER_MESSAGE,
  HUELLAS_PAIN_BONUS,
  PAIN_KEYWORDS,
} from '../services/gamificationService';

export function useGamification(uid) {
  const [gamification, setGamification] = useState(null);
  const [pending, setPending] = useState(null);
  const dataRef = useRef(null);

  useEffect(() => {
    if (!uid) {
      setGamification(null);
      return undefined;
    }
    return subscribeGamification(uid, (data) => {
      dataRef.current = data;
      setGamification(data);
    });
  }, [uid]);

  useEffect(() => {
    if (uid && !gamification) {
      initGamification(uid);
    }
  }, [uid, gamification]);

  const reward = useCallback(
    async (payload) => {
      if (!uid) return null;
      const result = await applyReward(uid, dataRef.current, payload);
      dataRef.current = result.data;
      setGamification(result.data);
      setPending(payload);
      setTimeout(() => setPending(null), 2500);
      return result;
    },
    [uid]
  );

  const rewardMessage = useCallback(
    async (content, options = {}) => {
      const text = String(content || '');
      const isPain = options.pain || PAIN_KEYWORDS.some((word) => text.toLowerCase().includes(word));
      const payload = {
        xp: XP_PER_MESSAGE + (isPain ? XP_PAIN_BONUS : 0),
        huellas: HUELLAS_PER_MESSAGE + (isPain ? HUELLAS_PAIN_BONUS : 0),
        messages: 1,
        ...(options.notes ? { painNotes: options.notes } : {}),
      };
      return reward(payload);
    },
    [reward]
  );

  const rewardConversation = useCallback(
    async (options = {}) => {
      return reward({
        xp: XP_CONVERSATION_BONUS,
        conversations: 1,
        painNotes: options.notes || 0,
        conclusionDone: true,
      });
    },
    [reward]
  );

  return {
    gamification,
    pending,
    rewardMessage,
    rewardConversation,
  };
}
