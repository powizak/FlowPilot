import { create } from 'zustand';
import { User } from '@flowpilot/shared/src/types/user';
import { api } from '../lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  setAuth: (user, token, refreshTokenStr) => {
    localStorage.setItem('refreshToken', refreshTokenStr);
    set({ user, accessToken: token });
  },
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const {
      user,
      accessToken,
      refreshToken: newRefreshToken,
    } = response.data.data;
    get().setAuth(user, accessToken, newRefreshToken);
  },
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
    });
    const {
      user,
      accessToken,
      refreshToken: newRefreshToken,
    } = response.data.data;
    get().setAuth(user, accessToken, newRefreshToken);
  },
  logout: () => {
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null });
  },
  refreshToken: async () => {
    try {
      const storedToken = localStorage.getItem('refreshToken');
      if (!storedToken) throw new Error('No refresh token');

      const response = await api.post('/auth/refresh', {
        refreshToken: storedToken,
      });
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;

      localStorage.setItem('refreshToken', newRefreshToken);
      set({ accessToken });
    } catch (error) {
      get().logout();
      throw error;
    }
  },
}));
