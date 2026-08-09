import { onValue, ref } from 'firebase/database';
import { rtdb } from '../firebase';

export function sanitizeOrg(organizacion) {
  return (organizacion || '')
    .trim()
    .replace(/[.#$[\]/]/g, '')
    .toLowerCase();
}

export function subscribeRole(uid, callback) {
  return onValue(
    ref(rtdb, `users/${uid}`),
    (snapshot) => {
      const data = snapshot.val();
      callback(data || null);
    },
    () => callback(null)
  );
}

export function subscribeAllUsers(callback, organizacion = '') {
  const org = (organizacion || '').trim().toLowerCase();
  const usersRef = ref(rtdb, 'users');
  const emit = (snapshot) => {
    const raw = snapshot.val();
    if (!raw) {
      callback([]);
      return;
    }
    const list = Object.entries(raw)
      .filter(([, profile]) => profile?.role !== 'lider')
      .filter(
        ([, profile]) => !org || (profile?.organizacion || '').trim().toLowerCase() === org
      )
      .map(([uid, profile]) => ({ uid, ...profile }));
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    callback(list);
  };
  const off = onValue(usersRef, emit, () => callback([]));
  return () => off();
}

export function subscribeAllConversations(callback, organizacion = '') {
  const org = (organizacion || '').trim().toLowerCase();
  const usersRef = ref(rtdb, 'users');
  const convRef = ref(rtdb, 'conversations');
  const offUsers = onValue(
    usersRef,
    (usersSnap) => {
      const usersRaw = usersSnap.val() || {};
      offConv();
      offConv = onValue(
        convRef,
        (snapshot) => {
          const raw = snapshot.val();
          if (!raw) {
            callback({});
            return;
          }
          const result = {};
          Object.entries(raw).forEach(([uid, conversations]) => {
            const profile = usersRaw[uid] || {};
            if (profile.role === 'lider') return;
            const userOrg = (profile.organizacion || '').trim().toLowerCase();
            if (org && userOrg !== org) return;
            result[uid] = Object.entries(conversations || {}).map(([id, data]) => ({
              id,
              ...data,
            }));
          });
          callback(result);
        },
        () => callback({})
      );
    },
    () => callback({})
  );
  let offConv = () => {};
  return () => {
    offUsers();
    offConv();
  };
}
