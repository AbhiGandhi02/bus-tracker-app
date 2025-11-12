import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';
import { User, LoginCredentials, SignupData, AuthContextType } from '../types';

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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getMe();
        // Backend returns: { success: true, user: {...} }
        if (response.data.success && response.data.user) {
          setUser(response.data.user);
        } else {
          throw new Error('Invalid user data');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const signup = async (userData: SignupData) => {
    try {
      setError(null);
      const response = await authAPI.signup(userData);
      // Backend returns: { success: true, token: "...", user: {...} }
      if (response.data.success) {
        const { token, user: newUser } = response.data;
        localStorage.setItem('token', token);
        setUser(newUser);
        return { success: true };
      }
      throw new Error('Invalid response from server');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Signup failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      const response = await authAPI.login(credentials);
      // Backend returns: { success: true, token: "...", user: {...} }
      if (response.data.success) {
        const { token, user: loggedInUser } = response.data;
        localStorage.setItem('token', token);
        setUser(loggedInUser);
        return { success: true };
      }
      throw new Error('Invalid response from server');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signup,
    login,
    logout,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};