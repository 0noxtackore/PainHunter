import { get, onValue, ref } from 'firebase/database';
import { rtdb } from '../firebase';

export async function checkAccountRole(email, password) {
  const response = await fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' +
      import.meta.env.VITE_FIREBASE_API_KEY,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  if (!response.ok) return { error: 'invalid' };
  const data = await response.json();
  const token = data.idToken;
  if (!token) return { uid: data.localId, role: null };
  const dbResponse = await fetch(
    `https://pain-hunter-default-rtdb.europe-west1.firebasedatabase.app/admins/${data.localId}.json?auth=${token}`
  );
  if (!dbResponse.ok) return { uid: data.localId, role: null };
  const roleData = await dbResponse.json();
  return {
    uid: data.localId,
    role: roleData?.role || null,
  };
}

export function subscribeRole(uid, callback) {
  return onValue(
    ref(rtdb, `admins/${uid}`),
    (snapshot) => {
      const data = snapshot.val();
      callback(data || null);
    },
    () => callback(null)
  );
}

export function subscribeAllUsers(callback, organizacion = '') {
  let cachedAdminUids = new Set();
  let timer = null;
  const emit = () => {
    const usersRef = ref(rtdb, 'users');
    onValue(
      usersRef,
      (snapshot) => {
        const raw = snapshot.val();
        if (!raw) {
          callback([]);
          return;
        }
        const org = (organizacion || '').trim().toLowerCase();
        const list = Object.entries(raw)
          .filter(([uid]) => !cachedAdminUids.has(uid))
          .filter(
            ([, profile]) =>
              !org || (profile?.organizacion || '').trim().toLowerCase() === org
          )
          .map(([uid, profile]) => ({ uid, ...profile }));
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        callback(list);
      },
      () => callback([])
    );
  };
  onValue(
    ref(rtdb, 'admins'),
    (snapshot) => {
      cachedAdminUids = new Set(Object.keys(snapshot.val() || {}));
      if (timer) clearTimeout(timer);
      timer = setTimeout(emit, 0);
    },
    () => emit()
  );
}

export function subscribeAllConversations(callback, organizacion = '') {
  const org = (organizacion || '').trim().toLowerCase();
  const emit = () => {
    const usersRef = ref(rtdb, 'users');
    const convRef = ref(rtdb, 'conversations');
    onValue(
      usersRef,
      (usersSnap) => {
        const usersRaw = usersSnap.val() || {};
        onValue(
          convRef,
          (snapshot) => {
            const raw = snapshot.val();
            if (!raw) {
              callback({});
              return;
            }
            const result = {};
            Object.entries(raw).forEach(([uid, conversations]) => {
              const userOrg = (usersRaw[uid]?.organizacion || '').trim().toLowerCase();
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
  };
  return emit();
}

export async function getRole(uid) {
  const snap = await get(ref(rtdb, `admins/${uid}`));
  return snap.exists() ? (snap.val()?.role || null) : null;
}
