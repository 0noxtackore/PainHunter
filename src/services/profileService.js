import { get, onValue, ref, set } from 'firebase/database';
import { rtdb } from '../firebase';

export function saveProfile(uid, data) {
  return set(ref(rtdb, `users/${uid}`), data);
}

export function subscribeProfile(uid, callback) {
  return onValue(
    ref(rtdb, `users/${uid}`),
    (snapshot) => callback(snapshot.val() || {}),
    () => callback({})
  );
}

export async function getProfile(uid) {
  const snap = await get(ref(rtdb, `users/${uid}`));
  return snap.exists() ? snap.val() : {};
}
