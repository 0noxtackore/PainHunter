import { get, onValue, ref, set, update } from 'firebase/database';
import { rtdb } from '../firebase';

const gamificationRef = (uid) => ref(rtdb, `gamification/${uid}`);

export const XP_PER_MESSAGE = 10;
export const XP_PAIN_BONUS = 15;
export const XP_CONVERSATION_BONUS = 25;
export const HUELLAS_PER_MESSAGE = 1;
export const HUELLAS_PAIN_BONUS = 3;

export const PAIN_KEYWORDS = [
  'dolor', 'duele', 'duele mucho', 'cansancio', 'agotado', 'agotamiento', 'fatiga',
  'estres', 'estresado', 'presion', 'insomnio', 'no duermo', 'no descanso',
  'sufro', 'sufriendo', 'angustia', 'ansiedad', 'triste', 'deprimid', 'llorar',
  'lloro', 'pesa', 'agobiad', 'angusti', 'solo', 'sola', 'sin esperanza',
  'migrana', 'cefalea', 'sintiendo mal', 'me siento mal', 'no puedo mas',
];

export function levelFromXp(xp) {
  let level = 1;
  let remaining = Math.max(0, Math.floor(xp || 0));
  while (true) {
    const required = level * 100;
    if (remaining < required) break;
    remaining -= required;
    level += 1;
  }
  return { level, intoLevel: remaining, requiredForNext: level * 100 };
}

export const TROPHIES = [
  { id: 'first-message', name: 'Primer paso', description: 'Envía tu primer mensaje a Mr Hunter.', icon: '💬' },
  { id: 'ten-messages', name: 'En confianza', description: 'Envía 10 mensajes en total.', icon: '🗣️' },
  { id: 'fifty-messages', name: 'Conversador', description: 'Envía 50 mensajes en total.', icon: '💬' },
  { id: 'first-chat', name: 'Abrir el corazón', description: 'Completa tu primera conversación.', icon: '❤️' },
  { id: 'five-chats', name: 'Constancia', description: 'Completa 5 conversaciones.', icon: '📚' },
  { id: 'first-pain', name: 'Reconocer el dolor', description: 'Registra tu primera nota de dolor.', icon: '🩹' },
  { id: 'pain-noted', name: 'Vigilante de ti mismo', description: 'Registra 10 notas de dolor.', icon: '📋' },
  { id: 'level-2', name: 'Crecimiento', description: 'Alcanza el nivel 2.', icon: '🌱' },
  { id: 'level-3', name: 'Resiliencia', description: 'Alcanza el nivel 3.', icon: '🌿' },
  { id: 'level-5', name: 'Fuerza interior', description: 'Alcanza el nivel 5.', icon: '⭐' },
  { id: 'streak-3', name: 'Racha de 3 días', description: 'Habla con Mr Hunter 3 días seguidos.', icon: '🔥' },
  { id: 'conclusion-done', name: 'Cierre positivo', description: 'Recibe tu primera recomendación.', icon: '🏁' },
];

export function subscribeGamification(uid, callback) {
  return onValue(
    gamificationRef(uid),
    (snapshot) => callback(snapshot.val() || null),
    () => callback(null)
  );
}

export async function getGamification(uid) {
  const snap = await get(gamificationRef(uid));
  return snap.exists() ? snap.val() : null;
}

export function initGamification(uid) {
  const now = Date.now();
  return set(gamificationRef(uid), {
    xp: 0,
    huellas: 0,
    messages: 0,
    conversations: 0,
    painNotes: 0,
    trophies: {},
    lastActiveDay: now,
    streak: 1,
    bestStreak: 1,
    createdAt: now,
  }).catch(() => {});
}

function trophyIdsFromStats(stats, level) {
  const ids = [];
  if (stats.messages >= 1) ids.push('first-message');
  if (stats.messages >= 10) ids.push('ten-messages');
  if (stats.messages >= 50) ids.push('fifty-messages');
  if (stats.conversations >= 1) ids.push('first-chat');
  if (stats.conversations >= 5) ids.push('five-chats');
  if (stats.painNotes >= 1) ids.push('first-pain');
  if (stats.painNotes >= 10) ids.push('pain-noted');
  if (level >= 2) ids.push('level-2');
  if (level >= 3) ids.push('level-3');
  if (level >= 5) ids.push('level-5');
  if (stats.streak >= 3) ids.push('streak-3');
  if (stats.conclusionDone) ids.push('conclusion-done');
  return ids;
}

export async function applyReward(uid, current, payload) {
  const now = Date.now();
  const base = current || {
    xp: 0,
    huellas: 0,
    messages: 0,
    conversations: 0,
    painNotes: 0,
    trophies: {},
    streak: 1,
    bestStreak: 1,
    lastActiveDay: now,
    createdAt: now,
  };

  const newXp = (base.xp || 0) + (payload.xp || 0);
  const newHuellas = (base.huellas || 0) + (payload.huellas || 0);
  const newMessages = (base.messages || 0) + (payload.messages || 0);
  const newConversations = (base.conversations || 0) + (payload.conversations || 0);
  const newPainNotes = (base.painNotes || 0) + (payload.painNotes || 0);

  let streak = base.streak || 1;
  const todayKey = new Date(now).toDateString();
  const lastKey = base.lastActiveDay ? new Date(base.lastActiveDay).toDateString() : '';
  if (todayKey !== lastKey) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toDateString();
    streak = lastKey === yesterdayKey ? (base.streak || 1) + 1 : 1;
  }

  const { level } = levelFromXp(newXp);
  const unlocked = trophyIdsFromStats(
    {
      messages: newMessages,
      conversations: newConversations,
      painNotes: newPainNotes,
      streak,
      conclusionDone: Boolean(base.conclusionDone) || Boolean(payload.conclusionDone),
    },
    level
  );

  const trophies = { ...(base.trophies || {}) };
  for (const id of unlocked) {
    if (!trophies[id]) trophies[id] = now;
  }

  const data = {
    xp: newXp,
    huellas: newHuellas,
    messages: newMessages,
    conversations: newConversations,
    painNotes: newPainNotes,
    trophies,
    streak,
    bestStreak: Math.max(base.bestStreak || 1, streak),
    lastActiveDay: now,
    conclusionDone: Boolean(base.conclusionDone) || Boolean(payload.conclusionDone),
  };

  await update(gamificationRef(uid), data).catch(() => {});
  return { data, level };
}
