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
import ParseProgressBar from "../components/common/ParseProgressBar";

/**
 * Grouped layout (wide):
 * - 12-col grid. Sidebar = 3 cols; Content = 9 cols.
 * - Inside content: 3 equal columns for Cited / Weakly / Uncited.
 * - Each column has its own scroll (max-h 80vh) and sticky header.
 */
export function Dashboard() {
  const { claudeApiKey } = useApiKey();
  const { claims, progress, error, isDone, start, stop, setClaims } =
    useClaimsStream();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo<Claim | null>(
    () => claims.find((c) => c.id === selectedId) ?? null,
    [claims, selectedId]
  );

  useEffect(() => {
    const jobId = localStorage.getItem("papertrail_job_id");
    if (claudeApiKey && jobId) {
      start(jobId, claudeApiKey);
    }
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claudeApiKey]);

  const onJob = (jobId: string) => {
    if (!claudeApiKey) return;
    // start() will reset state for a new job, so old claims vanish immediately
    start(jobId, claudeApiKey);
  };

  const onUpdateClaim = (updated: Claim) => {
    const next = claims.map((c) => (c.id === updated.id ? updated : c));
    setClaims(next);
  };

  const groups = useMemo(() => {
    const cited: Claim[] = [];
    const weakly: Claim[] = [];
    const uncited: Claim[] = [];
    for (const c of claims) {
      if (c.status === "cited") cited.push(c);
      else if (c.status === "weakly_cited") weakly.push(c);
      else uncited.push(c);
    }
    return { cited, weakly, uncited };
  }, [claims]);

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Sidebar */}
        <div className="space-y-6 xl:col-span-3">
          <PaperUploadCard onJob={onJob} />

          <div className="card p-4">
            <div className="mb-2 text-sm subtle">
              Parsing & claim extraction
            </div>
            <ParseProgressBar progress={progress} done={isDone} />

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

        {/* Content */}
        <div className="xl:col-span-9">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Column title="CITED" count={groups.cited.length}>
              <ClaimList
                claims={groups.cited}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </Column>
            <Column title="WEAKLY CITED" count={groups.weakly.length}>
              <ClaimList
                claims={groups.weakly}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </Column>
            <Column title="UNCITED" count={groups.uncited.length}>
              <ClaimList
                claims={groups.uncited}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </Column>
          </div>
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

function Column({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col h-[80vh]">
      <div className="overflow-y-auto flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[rgba(19,23,32,0.85)] backdrop-blur-md">
          <h3
            className="text-sm tracking-wide"
            style={{ letterSpacing: "0.06em" }}
          >
            {title}
          </h3>
          <span className="text-xs subtle">{count}</span>
        </header>
        <div className="px-3 pb-4 pt-3">{children}</div>
      </div>
    </section>
  );
}
