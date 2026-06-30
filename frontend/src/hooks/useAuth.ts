'use client';
import { create } from 'zustand';
import { User } from '@/types';
import { authApi } from '@/lib/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    if (data.requires2FA) return { requires2FA: true, tempToken: data.tempToken };
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user, isAuthenticated: true, isLoading: false });
    return { requires2FA: false };
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) await authApi.logout(refreshToken);
    } catch { /* ignore */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) { set({ isLoading: false }); return; }
      const { data } = await authApi.me();
      set({ user: data, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ isLoading: false });
    }
  },

  setUser: (user: User) => set({ user }),
}));
