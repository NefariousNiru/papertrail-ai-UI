// src/features/api-key/useApiKey.ts
import { create } from "zustand";

export interface ApiKeyState {
  claudeApiKey: string | null;
  rememberOnDevice: boolean;
  setKey: (key: string, remember: boolean) => void;
  clearKey: () => void;
}

/**
 * Flow comment:
 * We keep the API key in memory by default.
 * If rememberOnDevice is true, we mirror into localStorage.
 * (You can switch to localStorage if you want longer persistence.)
 */
export const useApiKey = create<ApiKeyState>((set) => ({
  claudeApiKey: (() => {
    const saved = localStorage.getItem("papertrail_api_key");
    return saved && saved.length > 0 ? saved : null;
  })(),
  rememberOnDevice: localStorage.getItem("papertrail_api_key") !== null,
  setKey: (key: string, remember: boolean) => {
    const trimmed = key.trim();
    if (trimmed.length === 0) return;
    if (remember) {
      localStorage.setItem("papertrail_api_key", trimmed);
    } else {
      localStorage.removeItem("papertrail_api_key");
    }
    set({ claudeApiKey: trimmed, rememberOnDevice: remember });
  },
  clearKey: () => {
    localStorage.removeItem("papertrail_api_key");
    set({ claudeApiKey: null, rememberOnDevice: false });
  },
}));
