import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { get, ref, update } from 'firebase/database';
import { auth, rtdb } from '../firebase';
import { saveProfile } from '../services/profileService';
import { sanitizeOrg, subscribeRole } from '../services/adminService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [organizacion, setOrganizacion] = useState('');
  const [roleLoaded, setRoleLoaded] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setInitializing(false);
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      setRole(null);
      setOrganizacion('');
      setRoleLoaded(false);
      return undefined;
    }
    setRoleLoaded(false);
    return subscribeRole(user.uid, (info) => {
      setRole(info?.role || null);
      setOrganizacion(info?.organizacion || '');
      setRoleLoaded(true);
    });
  }, [user?.uid]);

  const isAdmin = role === 'lider';

  const value = useMemo(
    () => ({
      user,
      role,
      organizacion,
      roleLoaded,
      isAdmin,
      initializing,
      login: (email, password) => signInWithEmailAndPassword(auth, email, password),
      signup: async (name, email, password, gender, organizacion = '', role = 'empleado') => {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        try {
          await updateProfile(credentials.user, { displayName: name });
          if (role === 'lider') {
            const org = (organizacion || '').trim();
            const orgKey = sanitizeOrg(org);
            const counterRef = ref(rtdb, `organizaciones/${orgKey}/lideres`);
            const snap = await get(counterRef);
            const current = snap.exists() ? Number(snap.val()) : 0;
            if (current >= 2) {
              throw new Error('MAX_LEADERS');
            }
            await update(rtdb, {
              [`users/${credentials.user.uid}`]: {
                name,
                gender: gender || 'otro',
                organizacion: org,
                role: 'lider',
              },
              [`organizaciones/${orgKey}/lideres`]: current + 1,
            });
          } else {
            await saveProfile(credentials.user.uid, {
              name,
              gender: gender || 'otro',
              organizacion: (organizacion || '').trim(),
              role: 'empleado',
            });
          }
          return credentials;
        } catch (err) {
          try {
            await credentials.user.delete();
          } catch {
            /* sin sesión activa */
          }
          throw err;
        }
      },
      logout: () => signOut(auth),
    }),
    [user, role, organizacion, roleLoaded, isAdmin, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
