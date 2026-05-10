import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEV_AUTH_CREDENTIALS = {
  username: 'admin@evogirl.dev',
  password: 'Promise@123',
} as const;

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      username: null,
      login: (username, password) => {
        const isValid =
          username.trim().toLowerCase() === DEV_AUTH_CREDENTIALS.username &&
          password === DEV_AUTH_CREDENTIALS.password;

        if (isValid) {
          set({ isAuthenticated: true, username: DEV_AUTH_CREDENTIALS.username });
        }

        return isValid;
      },
      logout: () => set({ isAuthenticated: false, username: null }),
    }),
    {
      name: 'promise-admin-auth',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        username: state.username,
      }),
    },
  ),
);
