import { create } from "zustand";
import type { Admin } from "@/types";
import { authService } from "@/services/auth.service";
import { guideService } from "@/services/guide.service";

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

      // Auto-login to Guide API backend only if user's role requires guide access
      const needsGuideAccess = data.admin && ["superadmin", "admin", "operations", "finance"].includes(data.admin.role);
      if (needsGuideAccess) {
        try {
          console.log("🤖 Attempting auto-login to Guide API backend...");
          const guideAuth = await guideService.login("9999999999", "admin");
          localStorage.setItem("guide_token", guideAuth.id.toString());
          console.log("✅ Guide API auto-login success, guide_token stored:", guideAuth.id);
        } catch (guideErr) {
          console.warn("⚠️ Failed to auto-login to Guide API backend during login:", guideErr);
        }
      }

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

      // Auto-login to Guide API backend if token is present but guide_token is missing, and user's role requires guide access
      const needsGuideAccess = admin && ["superadmin", "admin", "operations", "finance"].includes(admin.role);
      if (needsGuideAccess && !guideToken) {
        try {
          console.log("🤖 Guide token missing but authenticated, auto-logging into Guide API...");
          const guideAuth = await guideService.login("9999999999", "admin");
          localStorage.setItem("guide_token", guideAuth.id.toString());
          console.log("✅ Guide API auto-login success, guide_token stored:", guideAuth.id);
        } catch (guideErr) {
          console.warn("⚠️ Failed to auto-login to Guide API backend during checkAuth:", guideErr);
        }
      }

      set({ admin, isAuthenticated: true, isLoading: false });
    } catch (err) {
      console.error("❌ Auth check failed:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("guide_token");
      set({ admin: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
