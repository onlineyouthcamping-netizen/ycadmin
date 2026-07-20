import { create } from "zustand";
import type { Admin } from "@/types";
import { authService } from "@/services/auth.service";
import { guideService } from "@/services/guide.service";

function looksLikeJwt(value: string | null | undefined): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(atob(parts[1]));
    if (payload && typeof payload.exp === 'number') {
      return payload.exp * 1000 > Date.now() + 60000; // token is valid for at least 1 more minute
    }
  } catch (e) {}
  return true;
}

let guideLoginPromise: Promise<string | null> | null = null;

export async function ensureGuideToken(phone: string, role: string): Promise<string | null> {
  const legacy = localStorage.getItem("guide_token");
  if (legacy) {
    if (looksLikeJwt(legacy)) {
      localStorage.setItem("guide_access_token", legacy);
    }
    localStorage.removeItem("guide_token");
  }

  const stored = localStorage.getItem("guide_access_token");
  if (looksLikeJwt(stored)) {
    return stored;
  }

  if (guideLoginPromise) {
    return guideLoginPromise;
  }

  guideLoginPromise = (async () => {
    try {
      console.log("🤖 Attempting to ensure Guide API token...");
      const guideAuth = await guideService.login(phone, role);
      if (guideAuth && guideAuth.token && looksLikeJwt(guideAuth.token)) {
        localStorage.setItem("guide_access_token", guideAuth.token);
        console.log("✅ Guide API token acquired successfully.");
        return guideAuth.token;
      }
      return null;
    } catch (guideErr) {
      console.warn("⚠️ Failed to acquire Guide API token:", guideErr);
      return null;
    }
  })();

  try {
    return await guideLoginPromise;
  } finally {
    guideLoginPromise = null;
  }
}

interface AuthState {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsGuide: (phone: string) => Promise<void>;
  logout: () => void;
  checkAuth: (force?: boolean) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    set({ isLoading: true });
    console.log("🚀 Attempting login for:", email);
    try {
      const auth = await authService.login(email, password);
      localStorage.setItem("token", auth.token);
      set({ admin: auth.admin, isAuthenticated: true, isLoading: false });
    } catch (err) {
      console.error("❌ Login failed:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  loginAsGuide: async (phone) => {
    set({ isLoading: true });
    console.log("🚀 Attempting guide login for phone:", phone);
    try {
      const guideAuth = await guideService.login(phone, 'guide');
      if (guideAuth && guideAuth.token) {
        localStorage.setItem("guide_access_token", guideAuth.token);
      }
      set({
        admin: {
          id: guideAuth.id.toString(),
          name: guideAuth.name,
          email: guideAuth.email || null,
          role: "guide",
          isActive: true,
          tokenVersion: 0
        },
        isAuthenticated: true,
        isLoading: false
      });
    } catch (err) {
      console.error("❌ Guide login failed:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("guide_access_token");
    localStorage.removeItem("guide_token");
    guideLoginPromise = null;
    set({ admin: null, isAuthenticated: false });
  },

  checkAuth: async (force = false) => {
    const currentState = get();
    if (!force && currentState.isAuthenticated && currentState.admin) {
      set({ isLoading: false });
      return;
    }

    const token = localStorage.getItem("token");
    const guideToken = localStorage.getItem("guide_access_token");
    
    const hasValidToken = token && token.trim() !== ""; // Admin tokens might be structured or session strings
    const hasValidGuideToken = looksLikeJwt(guideToken);
    
    if (!hasValidToken && !hasValidGuideToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("guide_access_token");
      localStorage.removeItem("guide_token");
      set({ admin: null, isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });

    // Case 1: Guide login session
    if (hasValidGuideToken && !hasValidToken) {
      try {
        const guideProfile = await guideService.getProfile();
        set({
          admin: {
            id: guideProfile.id.toString(),
            name: guideProfile.name,
            email: guideProfile.email || null,
            role: "guide",
            isActive: true,
            tokenVersion: 0
          },
          isAuthenticated: true,
          isLoading: false
        });
      } catch (err) {
        console.error("❌ Guide auth check failed:", err);
        localStorage.removeItem("guide_access_token");
        localStorage.removeItem("guide_token");
        set({ admin: null, isAuthenticated: false, isLoading: false });
      }
      return;
    }

    // Case 2: Admin/manager login session
    try {
      const admin = await authService.getMe();
      set({ admin, isAuthenticated: true, isLoading: false });
    } catch (err) {
      console.error("❌ Auth check failed:", err);
      localStorage.removeItem("token");
      set({ admin: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
