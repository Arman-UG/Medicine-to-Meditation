'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User, getToken, setToken, removeToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (name: string, email: string, pass: string, stress?: string | null) => Promise<User>;
  logout: () => void;
  updateStress: (level: string | null) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.getProfile();
      setUser({
        ...res.user,
        subscription: res.subscription
      });
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const register = async (name: string, email: string, pass: string, stress?: string | null) => {
    const res = await api.register({ full_name: name, email, password: pass, stress_level: stress });
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const updateStress = async (level: string | null) => {
    if (!user) return;
    try {
      await api.updateStressLevel(level);
      setUser(prev => prev ? { ...prev, stress_level: level as any } : null);
    } catch (err) {
      console.error('Failed to save stress level:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateStress, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
