import { create } from "zustand";
import type { Admin } from "@/types";
import { authService } from "@/services/auth.service";
import { guideService } from "@/services/guide.service";

/**
 * Structural JWT check — verifies the token has 3 dot-separated parts.
 * Does NOT decode or check expiry.
 */
function isStructurallyValidJwt(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.split(".").length === 3;
}

/**
 * Check if a JWT token is expired (with optional buffer).
 * Returns true if the token IS expired or unreadable.
 */
function isJwtExpired(value: string | null | undefined, bufferMs = 60000): boolean {
  if (!value) return true;
  try {
    const parts = value.split(".");
    if (parts.length !== 3) return true;
    
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    base64 = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    
    // Properly decode UTF-8 to prevent JSON.parse from crashing on emojis/non-ASCII
    const jsonString = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const payload = JSON.parse(jsonString);
    if (payload && typeof payload.exp === "number") {
      return payload.exp * 1000 <= Date.now() + bufferMs;
    }
  } catch {
    return true;
  }
  return false; // No exp claim — treat as non-expiring
}

/**
 * Returns true if the value is a non-empty, non-corrupted string
 * that is NOT the literal "undefined" or "null".
 */
function isValidTokenString(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed !== "" && trimmed !== "undefined" && trimmed !== "null";
}

let guideLoginPromise: Promise<string | null> | null = null;

export async function ensureGuideToken(phone: string, role: string): Promise<string | null> {
  const legacy = localStorage.getItem("guide_token");
  if (legacy) {
    if (isStructurallyValidJwt(legacy) && !isJwtExpired(legacy)) {
      localStorage.setItem("guide_access_token", legacy);
    }
    localStorage.removeItem("guide_token");
  }

  const stored = localStorage.getItem("guide_access_token");
  if (isStructurallyValidJwt(stored) && !isJwtExpired(stored)) {
    return stored;
  }

  if (guideLoginPromise) {
    return guideLoginPromise;
  }

  guideLoginPromise = (async () => {
    try {
      const guideAuth = await guideService.login(phone, role);
      if (guideAuth && guideAuth.token && isStructurallyValidJwt(guideAuth.token)) {
        localStorage.setItem("guide_access_token", guideAuth.token);
        return guideAuth.token;
      }
      return null;
    } catch {
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

function getStoredAdmin(): Admin | null {
  try {
    const raw = typeof window !== "undefined" ? (localStorage.getItem("admin_user") || localStorage.getItem("admin")) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

const initialToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
const initialGuideToken = typeof window !== "undefined" ? localStorage.getItem("guide_access_token") : null;

const hasInitialAdminToken = isValidTokenString(initialToken) && isStructurallyValidJwt(initialToken) && !isJwtExpired(initialToken);
const hasInitialGuideToken = isValidTokenString(initialGuideToken) && isStructurallyValidJwt(initialGuideToken) && !isJwtExpired(initialGuideToken);

const initialAdmin = getStoredAdmin();
const initialHasAuth = (hasInitialAdminToken || hasInitialGuideToken) && !!initialAdmin;

export const useAuthStore = create<AuthState>((set, get) => ({
  admin: initialAdmin,
  isAuthenticated: initialHasAuth,
  isLoading: (hasInitialAdminToken || hasInitialGuideToken) && !initialAdmin,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const auth = await authService.login(email, password);
      if (!auth || !auth.token || !isValidTokenString(auth.token)) {
        throw new Error("Login failed: server returned an invalid token.");
      }
      localStorage.setItem("token", auth.token);
      if (auth.admin) {
        localStorage.setItem("admin_user", JSON.stringify(auth.admin));
      }
      set({ admin: auth.admin, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  loginAsGuide: async (phone) => {
    set({ isLoading: true });
    try {
      const guideAuth = await guideService.login(phone, "guide");
      if (guideAuth && guideAuth.token && isStructurallyValidJwt(guideAuth.token)) {
        localStorage.setItem("guide_access_token", guideAuth.token);
      }
      const gAdmin = {
        id: guideAuth.id.toString(),
        name: guideAuth.name,
        email: guideAuth.email || null,
        role: "guide",
        isActive: true,
        tokenVersion: 0,
      };
      localStorage.setItem("admin_user", JSON.stringify(gAdmin));
      set({
        admin: gAdmin,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("guide_access_token");
    localStorage.removeItem("guide_token");
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    localStorage.removeItem("admin_user");
    sessionStorage.clear();
    guideLoginPromise = null;
    set({ admin: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async (_force = false) => {
    const token = localStorage.getItem("token");
    const guideToken = localStorage.getItem("guide_access_token");

    const hasAdminToken = isValidTokenString(token) && isStructurallyValidJwt(token) && !isJwtExpired(token);
    const hasGuideToken = isValidTokenString(guideToken) && isStructurallyValidJwt(guideToken) && !isJwtExpired(guideToken);

    // No tokens at all — clear state immediately, no loading needed
    if (!hasAdminToken && !hasGuideToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("guide_access_token");
      localStorage.removeItem("guide_token");
      localStorage.removeItem("admin_user");
      set({ admin: null, isAuthenticated: false, isLoading: false });
      return;
    }

    // Only show loading spinner if we don't already have admin data in memory
    const currentAdmin = get().admin;
    if (!currentAdmin) {
      set({ isLoading: true });
    }

    // Case 1: Guide-only session
    if (hasGuideToken && !hasAdminToken) {
      try {
        const guideProfile = await guideService.getProfile();
        const gAdmin = {
          id: guideProfile.id.toString(),
          name: guideProfile.name,
          email: guideProfile.email || null,
          role: "guide",
          isActive: true,
          tokenVersion: 0,
        };
        localStorage.setItem("admin_user", JSON.stringify(gAdmin));
        set({
          admin: gAdmin,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem("guide_access_token");
        localStorage.removeItem("guide_token");
        localStorage.removeItem("admin_user");
        set({ admin: null, isAuthenticated: false, isLoading: false });
      }
      return;
    }

    // Case 2: Admin session — validate with backend
    try {
      const admin = await authService.getMe();
      if (admin) {
        localStorage.setItem("admin_user", JSON.stringify(admin));
      }
      set({ admin, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      if (err?.response?.status === 401) {
        // Token is definitively invalid/expired — clear everything
        localStorage.removeItem("token");
        localStorage.removeItem("admin_user");
        set({ admin: null, isAuthenticated: false, isLoading: false });
      } else {
        // Network error, 500, etc. — don't clear auth, just stop loading
        // If we had a previous admin state, keep it (optimistic)
        set({ isLoading: false });
      }
    }
  },
}));
