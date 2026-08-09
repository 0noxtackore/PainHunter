import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import { saveProfile } from '../services/profileService';
import { subscribeRole } from '../services/adminService';

const AuthContext = createContext(null);

const ROLE_LABELS = {
  ADMIN: 'ADMIN',
  VIGILANTE: 'VIGILANTE',
  BOSS: 'BOSS',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [organizacion, setOrganizacion] = useState('');
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
      return undefined;
    }
    return subscribeRole(user.uid, (info) => {
      setRole(info?.role || null);
      setOrganizacion(info?.organizacion || '');
    });
  }, [user?.uid]);

  const isAdmin = !!role && ROLE_LABELS[role] != null;

  const value = useMemo(
    () => ({
      user,
      role,
      organizacion,
      isAdmin,
      initializing,
      login: (email, password) => signInWithEmailAndPassword(auth, email, password),
      signup: async (name, email, password, gender, organizacion = '') => {
        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credentials.user, { displayName: name });
        await saveProfile(credentials.user.uid, {
          name,
          gender: gender || 'otro',
          organizacion: organizacion.trim(),
        }).catch(() => {});
        return credentials;
      },
      logout: () => signOut(auth),
    }),
    [user, role, organizacion, isAdmin, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
