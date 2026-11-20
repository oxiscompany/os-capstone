import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

interface User {
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: str) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('labnexus_token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('labnexus_user');
    return savedUser ? JSON.parse(savedUser) : { username: 'admin', role: 'admin' };
  });

  const login = async (username: string, password: str) => {
    const res = await api.login({ username, password });
    setToken(res.access_token);
    const userInfo = { username: res.username, role: res.role };
    setUser(userInfo);
    localStorage.setItem('labnexus_token', res.access_token);
    localStorage.setItem('labnexus_user', JSON.stringify(userInfo));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('labnexus_token');
    localStorage.removeItem('labnexus_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
