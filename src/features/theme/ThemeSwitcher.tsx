// src/features/theme/ThemeSwitcher.tsx
import { useTheme, type AccentTheme } from "./useTheme";

/**
 * Flow:
 * - A small select that toggles the accent theme.
 * - Writes to store -> ThemeMount updates <html> class.
 */
export function ThemeSwitcher() {
  const { accent, setAccent } = useTheme();

  return (
    <label className="flex items-center gap-2 text-sm subtle">
      Theme
      <select
        value={accent}
        onChange={(e) => setAccent(e.target.value as AccentTheme)}
        className="input"
        style={{ padding: "6px 10px", width: "auto" }}
        aria-label="Select accent theme"
      >
        <option value="rose">Rose</option>
        <option value="blue">Blue</option>
        <option value="emerald">Emerald</option>
        <option value="violet">Violet</option>
        <option value="cyan">Cyan</option>
      </select>
    </label>
  );
}
