// src/pages/Dashboard.tsx
import { useMemo, useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { PaperUploadCard } from "../features/upload/PaperUploadCard";
import { ClaimList } from "../components/claims/ClaimList";
import type { Claim } from "../lib/types";

/**
 * Flow:
 * - Left: upload + progress.
 * - Right: streamed claims.
 * - Route protection is handled in routes.tsx (RequireApiKey).
 */
export function Dashboard() {
  const [claims, setClaims] = useState<ReadonlyArray<Claim>>([]);
  const [progress, setProgress] = useState<{
    processed: number;
    total: number;
  } | null>(null);

  const handleClaimsStream = (incoming: ReadonlyArray<Claim>) =>
    setClaims(incoming);
  const handleProgress = (p: { processed: number; total: number }) =>
    setProgress(p);

  const completion = useMemo(() => {
    if (!progress || progress.total === 0) return 0;
    return Math.min(
      100,
      Math.round((progress.processed / progress.total) * 100)
    );
  }, [progress]);

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-1">
          <PaperUploadCard
            onProgress={handleProgress}
            onClaims={handleClaimsStream}
          />

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
          </div>
        </div>

        <div className="md:col-span-2">
          <ClaimList claims={claims} />
        </div>
      </div>
    </AppShell>
  );
}
