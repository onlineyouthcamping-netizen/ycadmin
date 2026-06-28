import { create } from "zustand";
import type { Admin } from "@/types";
import { authService } from "@/services/auth.service";
import { guideService } from "@/services/guide.service";

let guideLoginAttemptedThisSession = false;

export async function ensureGuideToken(phone: string, role: string): Promise<void> {
  if (guideLoginAttemptedThisSession) return;
  if (localStorage.getItem("guide_token")) return;

  guideLoginAttemptedThisSession = true;
  try {
    console.log("🤖 Attempting to ensure Guide API token...");
    const guideAuth = await guideService.login(phone, role);
    localStorage.setItem("guide_token", guideAuth.id.toString());
    console.log("✅ Guide API token acquired, stored:", guideAuth.id);
  } catch (guideErr) {
    console.warn("⚠️ Failed to acquire Guide API token:", guideErr);
  }
}

interface AuthState {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAsGuide: (phone: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password) => {
    set({ isLoading: true });
    console.log("🚀 Attempting login for:", email);
    try {
      const data = await authService.login(email, password);
      console.log("🔑 Login success, token received");
      localStorage.setItem("token", data.token);

      set({ 
        admin: data.admin, 
        isAuthenticated: true, 
        isLoading: false 
      });
    } catch (err) {
      console.error("🔥 Login error:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  loginAsGuide: async (phone) => {
    set({ isLoading: true });
    console.log("🚀 Attempting guide login for:", phone);
    try {
      const guideAuth = await guideService.login(phone, "guide");
      console.log("🔑 Guide login success, user ID received:", guideAuth.id);
      localStorage.setItem("guide_token", guideAuth.id.toString());
      set({ 
        admin: {
          id: guideAuth.id,
          name: guideAuth.name,
          email: guideAuth.email || null,
          role: "guide"
        },
        isAuthenticated: true,
        isLoading: false 
      });
    } catch (err) {
      console.error("🔥 Guide login error:", err);
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("guide_token");
    set({ admin: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    const token = localStorage.getItem("token");
    const guideToken = localStorage.getItem("guide_token");
    console.log("🔍 Checking auth, token exists:", !!token, "guideToken exists:", !!guideToken);
    
    if (!token && !guideToken) {
      console.log("🔄 No tokens found, redirecting to login...");
      set({ admin: null, isAuthenticated: false, isLoading: false });
      return;
    }

    // Case 1: Guide login session
    if (guideToken && !token) {
      try {
        console.log("🤖 Fetching guide profile...");
        const guideProfile = await guideService.getProfile();
        console.log("✅ Guide auth check success:", guideProfile.name);
        set({
          admin: {
            id: guideProfile.id,
            name: guideProfile.name,
            email: guideProfile.email || null,
            role: "guide"
          },
          isAuthenticated: true,
          isLoading: false
        });
      } catch (err) {
        console.error("❌ Guide auth check failed:", err);
        localStorage.removeItem("guide_token");
        set({ admin: null, isAuthenticated: false, isLoading: false });
      }
      return;
    }

    // Case 2: Admin/manager login session
    try {
      const admin = await authService.getMe();
      console.log("✅ Auth check success:", admin?.email || admin?.name || "Admin");

      set({ admin, isAuthenticated: true, isLoading: false });
    } catch (err) {
      console.error("❌ Auth check failed:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("guide_token");
      set({ admin: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
