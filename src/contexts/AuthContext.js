import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebaseService';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getUsers } from '../services/jsonService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const isFirebaseConfigured = () => {
  try {
    return (
      auth &&
      auth.app &&
      auth.app.options.apiKey &&
      auth.app.options.apiKey !== "VOTRE_API_KEY" &&
      auth.app.options.apiKey !== ""
    );
  } catch (e) {
    return false;
  }
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMockAuth, setIsMockAuth] = useState(!isFirebaseConfigured());

  // Log authentication mode
  useEffect(() => {
    console.log(`[Auth] Mode d'authentification : ${isMockAuth ? 'SIMULATION (JSON-Server / Local)' : 'FIREBASE'}`);
  }, [isMockAuth]);

  async function login(email, password) {
    if (!isMockAuth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential;
      } catch (error) {
        console.warn("Échec Firebase Auth, basculement vers la simulation...", error);
        // Fallback to mock auth if Firebase fails or isn't properly configured
      }
    }

    // Mock Auth logic
    try {
      const response = await getUsers();
      const users = response.data;
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        const sessionUser = {
          uid: user.id.toString(),
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          clientId: user.clientId || null
        };
        localStorage.setItem('auth_user', JSON.stringify(sessionUser));
        setCurrentUser(sessionUser);
        setUserRole(user.role);
        return sessionUser;
      } else {
        throw new Error("Email ou mot de passe incorrect.");
      }
    } catch (err) {
      throw new Error(err.message || "Erreur de connexion au serveur d'authentification.");
    }
  }

  async function logout() {
    if (!isMockAuth) {
      try {
        await signOut(auth);
      } catch (e) {
        console.error("Erreur lors de la déconnexion Firebase", e);
      }
    }
    localStorage.removeItem('auth_user');
    setCurrentUser(null);
    setUserRole(null);
  }

  useEffect(() => {
    if (!isMockAuth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          const token = await user.getIdTokenResult();
          const role = token.claims.role || 'client';
          const sessionUser = {
            uid: user.uid,
            email: user.email,
            role: role,
            name: user.displayName || user.email.split('@')[0],
            clientId: null // In real app, you would fetch this from Firestore/RealtimeDB using user.uid
          };
          setCurrentUser(sessionUser);
          setUserRole(role);
        } else {
          setCurrentUser(null);
          setUserRole(null);
        }
        setLoading(false);
      });
      return unsubscribe;
    } else {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setCurrentUser(parsed);
          setUserRole(parsed.role);
        } catch (e) {
          localStorage.removeItem('auth_user');
        }
      }
      setLoading(false);
    }
  }, [isMockAuth]);

  const value = { currentUser, userRole, login, logout, isMockAuth };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}