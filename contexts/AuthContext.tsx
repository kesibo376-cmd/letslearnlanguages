import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { User as AppUser } from '../types';
import { auth, db, firebase } from '../firebase';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { getDefaultData } from '../hooks/useUserData';


interface AuthContextType {
  user: AppUser | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // FIX: Use v8 compat syntax for onAuthStateChanged
    const unsubscribe = auth.onAuthStateChanged((firebaseUser: firebase.User | null) => {
      if (firebaseUser) {
        setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, pass: string): Promise<void> => {
    // FIX: Use v8 compat syntax for signInWithEmailAndPassword
    await auth.signInWithEmailAndPassword(email, pass);
  }, []);

  const signup = useCallback(async (email: string, pass: string): Promise<void> => {
    const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
    const newUser = userCredential.user;

    if (newUser) {
      const userDocRef = db.collection('users').doc(newUser.uid);
      const docSnap = await userDocRef.get();

      if (!docSnap.exists) {
        const timestamp = firebase.firestore.FieldValue.serverTimestamp();
        const userData = {
            ...getDefaultData(),
            email: newUser.email,
            status: 'pending',
            createdAt: timestamp,
        };
        const requestData = {
            email: newUser.email,
            status: 'pending',
            createdAt: timestamp,
        };

        const requestDocRef = db.collection('user_requests').doc(newUser.uid);

        // Use a batch write for atomicity
        const batch = db.batch();
        batch.set(userDocRef, userData);
        batch.set(requestDocRef, requestData);
        await batch.commit();
      }
    }
  }, []);
  
  const logout = useCallback(() => {
    // FIX: Use v8 compat syntax for signOut
    auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};