// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { PaperUploadCard } from "../features/upload/PaperUploadCard";
import { ClaimList } from "../components/claims/ClaimList";
import { ClaimDetailModal } from "../components/claims/ClaimDetailModal";
import { useApiKey } from "../features/api-key/useApiKey";
import type { Claim } from "../lib/types";
import { downloadJSON, downloadMarkdown } from "../lib/export";
import { useClaimsStream } from "../features/stream/useClaimsStreams";

/**
 * Flow:
 * - Start stream after upload OR resume from saved jobId.
 * - Right panel shows per-claim actions (verify).
 * - Export buttons let users download results; no server persistence.
 */
export function Dashboard() {
  const { claudeApiKey } = useApiKey();
  const { claims, progress, error, start, stop, setClaims } = useClaimsStream();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo<Claim | null>(
    () => claims.find((c) => c.id === selectedId) ?? null,
    [claims, selectedId]
  );

  // Resume from saved jobId on load
  useEffect(() => {
    const jobId = localStorage.getItem("papertrail_job_id");
    if (claudeApiKey && jobId) {
      start(jobId, claudeApiKey);
    }
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claudeApiKey]);

  const completion = useMemo(() => {
    if (!progress || progress.total === 0) return 0;
    return Math.min(
      100,
      Math.round((progress.processed / progress.total) * 100)
    );
  }, [progress]);

  const onJob = (jobId: string) => {
    if (!claudeApiKey) return;
    start(jobId, claudeApiKey);
  };

  const onUpdateClaim = (updated: Claim) => {
    const next = claims.map((c) => (c.id === updated.id ? updated : c));
    setClaims(next);
  };

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-1">
          <PaperUploadCard onJob={onJob} />

          <div className="card p-4">
            <div className="mb-2 text-sm subtle">
              Parsing & claim extraction
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ background: "var(--border)" }}
            >
              <div
                className="h-full transition-[width] duration-300"
                style={{ width: `${completion}%`, background: "var(--accent)" }}
              />
            </div>
            <div className="mt-1 text-right text-xs subtle">
              {progress ? `${progress.processed}/${progress.total}` : "0/0"}
            </div>

            {error && (
              <div
                className="mt-3 rounded-xl p-3 text-sm"
                style={{
                  background: "#2a1416",
                  color: "var(--error)",
                  border: "1px solid rgba(239,68,68,0.35)",
                }}
              >
                {error}
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button
                className="btn btn-outline"
                onClick={() => downloadJSON(claims)}
                disabled={claims.length === 0}
              >
                Export JSON
              </button>
              <button
                className="btn btn-outline"
                onClick={() => downloadMarkdown(claims)}
                disabled={claims.length === 0}
              >
                Export Markdown
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <ClaimList
            claims={claims}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>

      {selected && (
        <ClaimDetailModal
          claim={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={onUpdateClaim}
        />
      )}
    </AppShell>
  );
}
