import { create } from "zustand";
import type { Admin } from "@/types";
import { authService } from "@/services/auth.service";

interface AuthState {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const data = await authService.login(email, password);
      localStorage.setItem("token", data.token);
      set({ admin: data.admin, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ admin: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    const token = localStorage.getItem("token");

    if (!token) {
      set({ admin: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const admin = await authService.getMe();
      set({ admin, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem("token");
      set({ admin: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
