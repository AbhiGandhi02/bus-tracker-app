import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { User, AuthContextType } from '../types';
import axios from 'axios';
import config from '../config'; // Import config

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

interface AuthApiResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          
          const response = await axios.get<AuthApiResponse>(`${config.API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${idToken}`
            }
          });

          if (response.data.success && response.data.user) {
            setUser(response.data.user);
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (err: any) {
      const message = err.message || 'Failed to sign in with Google';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // --- NEW ROLE LOGIC ---
  const isMasterAdmin = () => {
    return user?.role === 'masteradmin';
  };

  const isPlanner = () => {
    // Planners are 'masteradmin' OR 'admin'
    return user?.role === 'masteradmin' || user?.role === 'admin';
  };

  const isOperator = () => {
    // Operators are 'masteradmin' OR 'driver'
    return user?.role === 'masteradmin' || user?.role === 'driver';
  };
  // --- END NEW ROLE LOGIC ---

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithGoogle,
    logout,
    isMasterAdmin,
    isPlanner,
    isOperator
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};