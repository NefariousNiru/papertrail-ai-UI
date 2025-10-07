// src/components/layout/AppShell.tsx
import type { PropsWithChildren } from "react";
import { ThemeSwitcher } from "../../features/theme/ThemeSwitcher";
import { ResetApiKeyButton } from "../../features/api-key/ResetApiKeyButton";

interface AppShellProps extends PropsWithChildren {
  title: string;
}

/**
 * Flow:
 * - Solid header with visible brand mark and border
 * - Content area centers to max width
 */
export function AppShell({ title, children }: AppShellProps) {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <header
        className="sticky top-0 z-40"
        style={{
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                background: "var(--accent)",
              }}
            />
            <span className="text-lg font-semibold">PaperTrail AI {title}</span>
          </div>

          <div className="flex items-center gap-5">
            <ThemeSwitcher />
            <ResetApiKeyButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}
