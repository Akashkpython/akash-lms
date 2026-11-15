import { create } from "zustand";
import { api, setToken, type ItemResponse } from "../lib/api";

export type User = {
  id: string;
  email: string;
  name: string;
  theme: "dark" | "light" | "system";
};

type AuthState = {
  user: User | null;
  ready: boolean;
  setupRequired: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  setup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateMe: (patch: Partial<User>) => Promise<void>;
};

function applyTheme(theme: User["theme"]) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.classList.toggle("light", !dark);
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,
  setupRequired: false,
  hydrate: async () => {
    try {
      const status = await api<ItemResponse<{ setupRequired: boolean }>>("/api/auth/status");
      if (status.data.setupRequired) {
        set({ setupRequired: true, ready: true, user: null });
        return;
      }
      const me = await api<ItemResponse<User>>("/api/auth/me");
      applyTheme(me.data.theme);
      set({ user: me.data, setupRequired: false, ready: true });
    } catch {
      setToken(null);
      set({ user: null, ready: true });
    }
  },
  login: async (email, password) => {
    const result = await api<ItemResponse<{ token: string; user: User }>>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(result.data.token);
    applyTheme(result.data.user.theme);
    set({ user: result.data.user, setupRequired: false });
  },
  setup: async (name, email, password) => {
    const result = await api<ItemResponse<{ token: string; user: User }>>("/api/auth/setup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    setToken(result.data.token);
    applyTheme(result.data.user.theme);
    set({ user: result.data.user, setupRequired: false });
  },
  logout: async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      /* token may already be invalid */
    }
    setToken(null);
    set({ user: null });
  },
  updateMe: async (patch) => {
    const result = await api<ItemResponse<User>>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    applyTheme(result.data.theme);
    set({ user: result.data });
  },
}));
