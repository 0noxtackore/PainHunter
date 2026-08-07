import { get, onValue, ref, remove, set } from 'firebase/database';
import { rtdb } from '../firebase';

const userRef = (uid) => ref(rtdb, `conversations/${uid}`);

export function subscribeConversations(uid, callback) {
  return onValue(
    userRef(uid),
    (snapshot) => {
      const raw = snapshot.val();
      if (!raw) {
        callback([]);
        return;
      }
      const list = Object.entries(raw).map(([id, data]) => ({
        id,
        ...data,
        messages: Array.isArray(data.messages) ? data.messages : [],
      }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(list);
    },
    () => callback(null)
  );
}

export async function loadConversation(uid, id) {
  const snap = await get(ref(rtdb, `conversations/${uid}/${id}`));
  return snap.exists() ? { id, ...snap.val() } : null;
}

export function saveConversation(uid, conversation) {
  const { id, ...data } = conversation;
  return set(ref(rtdb, `conversations/${uid}/${id}`), {
    ...data,
    updatedAt: Date.now(),
  });
}

export function deleteConversation(uid, id) {
  return remove(ref(rtdb, `conversations/${uid}/${id}`));
}
