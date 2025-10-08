// src/components/ParseProgressBar.tsx
import type { ProgressPayload, ProgressPhase } from "../../lib/types";

function phaseLabel(
  phase: ProgressPhase,
  processed: number,
  total: number
): string {
  switch (phase) {
    case "parse":
      return `Parsing page ${processed}/${total}`;
    case "extract":
      return `Extracting page ${processed}/${total}`;
    case "index":
      return `Indexing ${processed}/${total}`;
    case "verify":
      return `Verifying ${processed}/${total}`;
    default:
      return `${phase} ${processed}/${total}`;
  }
}

export default function ParseProgressBar({
  progress,
  done = false,
}: {
  progress: ProgressPayload | null;
  done?: boolean;
}) {
  if (!progress && !done) {
    return (
      <div className="space-y-1.5">
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ background: "var(--border)" }}
        >
          <div
            className="h-full w-1/3 animate-pulse"
            style={{ background: "var(--accent)" }}
          />
        </div>
        <div className="text-right text-xs subtle">Starting…</div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-1.5">
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ background: "var(--border)" }}
        >
          <div
            className="h-full w-full"
            style={{ background: "var(--accent)" }}
          />
        </div>
        <div className="flex items-center justify-between text-xs subtle">
          <span className="uppercase tracking-wide">done</span>
          <span>Completed</span>
        </div>
      </div>
    );
  }

  const phase = progress!.phase;
  const processed = Math.max(0, progress!.processed);
  const total = Math.max(0, progress!.total);
  const pct =
    total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;

  return (
    <div className="space-y-1.5">
      <div
        className="h-2 w-full overflow-hidden rounded-full"
        style={{ background: "var(--border)" }}
      >
        <div
          className="h-full transition-[width] duration-300"
          style={{ width: `${pct}%`, background: "var(--accent)" }}
        />
      </div>
      <div className="flex items-center justify-between text-xs subtle">
        <span className="uppercase tracking-wide">{phase}</span>
        <span>{phaseLabel(phase, processed, total)}</span>
      </div>
    </div>
  );
}
