// src/features/theme/ThemeMount.tsx
import { useEffect } from "react";
import { useTheme } from "./useTheme";

/**
 * Flow:
 * - Read accent from store and ensure <html> has .theme-<accent> class.
 * - Keeps the whole app in sync without repeating logic.
 */
export function ThemeMount() {
  const { accent } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    const classes = Array.from(root.classList);
    classes
      .filter((c) => c.startsWith("theme-"))
      .forEach((c) => root.classList.remove(c));
    root.classList.add(`theme-${accent}`);
  }, [accent]);

  return null;
}
