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
    // FIX: Use v8 compat syntax for createUserWithEmailAndPassword
    const userCredential = await auth.createUserWithEmailAndPassword(email, pass);
    const newUser = userCredential.user;

    // Create a new document for the user in Firestore
    if (newUser) {
      // FIX: Use v8 compat syntax for Firestore document reference
      const userDocRef = db.collection('users').doc(newUser.uid);
      
      // Check if document already exists to avoid overwriting on fast re-auth
      // FIX: Use v8 compat syntax for get() and .exists property
      const docSnap = await userDocRef.get();
      if (!docSnap.exists) {
        // FIX: Use v8 compat syntax for set()
        await userDocRef.set({
            ...getDefaultData(),
            email: newUser.email,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
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