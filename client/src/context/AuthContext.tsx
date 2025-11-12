import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { User, AuthContextType } from '../types'; // Removed ApiResponse from imports here
import axios from 'axios';

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

// Specific response type for auth endpoints that don't use the 'data' field
interface AuthApiResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get ID token
          const idToken = await firebaseUser.getIdToken();
          
          // Fetch user data from our backend
          // We use specific AuthApiResponse type here
          const response = await axios.get<AuthApiResponse>(`${API_URL}/auth/me`, {
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
  }, [API_URL]);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle the rest
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

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInWithGoogle,
    logout,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};