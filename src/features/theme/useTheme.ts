// src/features/theme/useTheme.ts
import { create } from "zustand";

export type AccentTheme = "blue" | "emerald" | "violet" | "rose" | "cyan";

interface ThemeState {
    accent: AccentTheme;
    setAccent: (accent: AccentTheme) => void;
}

const THEME_KEY = "papertrail_accent";

function isAccent(x: string | null): x is AccentTheme {
    return x === "blue" || x === "emerald" || x === "violet" || x === "rose" || x === "cyan";
}

export const useTheme = create<ThemeState>((set) => ({
    accent: (() => {
        const saved = localStorage.getItem(THEME_KEY);
        return isAccent(saved) ? saved : "rose";
    })(),
    setAccent: (accent) => {
        localStorage.setItem(THEME_KEY, accent);
        set({ accent });
    },
}));
