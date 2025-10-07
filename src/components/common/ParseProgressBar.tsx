// src/components/ParseProgressBar.tsx
import type { ProgressPayload } from "../../lib/types";

export default function ParseProgressBar({
  progress,
}: {
  progress: ProgressPayload | null;
}) {
  if (!progress || progress.phase !== "parse" || progress.total <= 0)
    return null;

  const pct = Math.min(
    100,
    Math.floor((progress.processed / progress.total) * 100)
  );
  const current = Math.min(progress.processed, progress.total);
  const updated = new Date((progress.ts || 0) * 1000).toLocaleTimeString();

  return (
    <div>
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: "var(--border)" }}
      >
        <div
          className="h-full transition-[width] duration-300"
          style={{ width: `${pct}%`, background: "var(--accent)" }}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          role="progressbar"
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs subtle">
        <span>
          {current}/{progress.total}
        </span>
        <span>Updated {updated}</span>
      </div>
    </div>
  );
}
