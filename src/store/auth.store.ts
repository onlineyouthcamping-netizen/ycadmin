import { create } from "zustand";
import type { Admin } from "@/types";
import { authService } from "@/services/auth.service";
import { guideService } from "@/services/guide.service";

/**
 * Structural JWT check — verifies the token has 3 dot-separated parts
 * and can be base64-decoded. Does NOT check expiry.
 */
function isStructurallyValidJwt(value: string | null | undefined): boolean {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  try {
    // Verify the payload is valid base64-encoded JSON
    JSON.parse(atob(parts[1]));
    return true;
  } catch {
    return false;
  }
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
    const payload = JSON.parse(atob(parts[1]));
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

export const useAuthStore = create<AuthState>((set, get) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: false, // Start false — AdminRoute checks token existence synchronously

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const auth = await authService.login(email, password);
      if (!auth || !auth.token || !isValidTokenString(auth.token)) {
        throw new Error("Login failed: server returned an invalid token.");
      }
      localStorage.setItem("token", auth.token);
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
      set({
        admin: {
          id: guideAuth.id.toString(),
          name: guideAuth.name,
          email: guideAuth.email || null,
          role: "guide",
          isActive: true,
          tokenVersion: 0,
        },
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
    guideLoginPromise = null;
    set({ admin: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async (_force = false) => {
    const token = localStorage.getItem("token");
    const guideToken = localStorage.getItem("guide_access_token");

    const hasAdminToken = isValidTokenString(token) && isStructurallyValidJwt(token);
    const hasGuideToken = isValidTokenString(guideToken) && isStructurallyValidJwt(guideToken) && !isJwtExpired(guideToken);

    // No tokens at all — clear state immediately, no loading needed
    if (!hasAdminToken && !hasGuideToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("guide_access_token");
      localStorage.removeItem("guide_token");
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
        set({
          admin: {
            id: guideProfile.id.toString(),
            name: guideProfile.name,
            email: guideProfile.email || null,
            role: "guide",
            isActive: true,
            tokenVersion: 0,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem("guide_access_token");
        localStorage.removeItem("guide_token");
        set({ admin: null, isAuthenticated: false, isLoading: false });
      }
      return;
    }

    // Case 2: Admin session — validate with backend
    try {
      const admin = await authService.getMe();
      set({ admin, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      if (err?.response?.status === 401) {
        // Token is definitively invalid/expired — clear everything
        localStorage.removeItem("token");
        set({ admin: null, isAuthenticated: false, isLoading: false });
      } else {
        // Network error, 500, etc. — don't clear auth, just stop loading
        // If we had a previous admin state, keep it (optimistic)
        set({ isLoading: false });
      }
    }
  },
}));
