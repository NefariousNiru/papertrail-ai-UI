// src/components/claims/ClaimDetailModal.tsx
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Claim, Evidence, Suggestion } from "../../lib/types";
import { verifyClaim, suggestCitations } from "../../lib/apiClient";
import { useApiKey } from "../../features/api-key/useApiKey";

/**
 * Flow:
 * - Larger modal (max-w-4xl) with generous spacing and readable typography.
 * - Modal content scrolls internally (max-h 85vh) so it never cuts off screen.
 * - Evidence is displayed inline as roomy cards (no collapsing).
 * - Actions: Upload & Verify, or Skip (skip is UI-only/ephemeral by design).
 * - For uncited/weakly_cited: auto-fetch and display citation suggestions.
 */
interface ClaimDetailModalProps {
  claim: Claim;
  onClose: () => void;
  onUpdate: (updated: Claim) => void;
}

const isUncitedish = (s?: Claim["status"]) =>
  s === "uncited" || s === "weakly_cited";

export function ClaimDetailModal({
  claim,
  onClose,
  onUpdate,
}: ClaimDetailModalProps) {
  const { claudeApiKey } = useApiKey();
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Suggestions state (local fetch state; persisted on the claim via onUpdate)
  const [ssLoading, setSsLoading] = useState(false);
  const [ssError, setSsError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const pickFile = () => inputRef.current?.click();

  // Auto-fetch suggestions on open for uncited/weakly_cited if not already present on the claim
  useEffect(() => {
    let cancelled = false;

    async function loadSuggestions() {
      if (!isUncitedish(claim.status)) return;
      if (claim.suggestions && claim.suggestions.length > 0) return;

      setSsError(null);
      setSsLoading(true);
      try {
        const items = await suggestCitations(claim.text); // returns Suggestion[]
        if (!cancelled && items.length > 0) {
          // Attach suggestions to the claim so they persist while app is open
          const merged = dedupeByUrl([...(claim.suggestions ?? []), ...items]);
          onUpdate({ ...claim, suggestions: merged });
        }
      } catch {
        if (!cancelled) setSsError("Could not fetch suggestions.");
      } finally {
        if (!cancelled) setSsLoading(false);
      }
    }

    loadSuggestions();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claim?.id]);

  async function handleVerify(file: File): Promise<void> {
    if (!claudeApiKey) {
      setError("API key missing.");
      return;
    }
    if (!file || file.size === 0) {
      setError("Selected file is empty.");
      return;
    }
    setError("");
    setBusy(true);

    try {
      const jobId = localStorage.getItem("papertrail_job_id") ?? "";
      if (!jobId) {
        setError("Missing job context. Please re-upload the paper.");
        setBusy(false);
        return;
      }

      const res = await verifyClaim(jobId, claim.id, file, claudeApiKey);

      onUpdate({
        ...claim,
        verdict: res.verdict,
        confidence: res.confidence,
        reasoningMd: res.reasoningMd,
        sourceUploaded: true,
        evidence: res.evidence ?? claim.evidence,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Verification failed.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  function handleSkip(): void {
    onUpdate({
      ...claim,
      verdict: "skipped",
      reasoningMd:
        claim.reasoningMd ?? "User chose to skip verification for this claim.",
      sourceUploaded: claim.sourceUploaded ?? false,
    });
    onClose();
  }

  if (!claim) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center px-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Claim details"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Scrollable modal card */}
      <div
        className="card w-full max-w-4xl p-8 max-h-[85vh] overflow-y-auto"
        style={{ gap: "1rem" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="text-sm subtle mb-2">Claim</div>
            <div style={{ fontSize: "1.05rem", lineHeight: 1.6 }}>
              {claim.text}
            </div>
          </div>
          <button
            className="btn btn-outline"
            onClick={onClose}
            aria-label="Close claim details"
          >
            Close
          </button>
        </div>

        {/* Chips row */}
        <div className="mt-4 flex flex-wrap items-center gap-8">
          <StatusChip status={claim.status} />
          {claim.verdict ? <VerdictBadge verdict={claim.verdict} /> : null}
          {typeof claim.confidence === "number" ? (
            <span
              className="rounded-md px-3 py-1 text-xs"
              style={{
                border: "1px solid var(--border)",
                background: "var(--surface)",
              }}
            >
              Confidence: {claim.confidence.toFixed(2)}
            </span>
          ) : null}
        </div>

        {/* Reasoning */}
        <section className="mt-6">
          <div className="text-sm subtle mb-2">Reasoning</div>
          {claim.reasoningMd ? (
            <div
              className="prose prose-invert max-w-none"
              style={{ fontSize: "0.975rem", lineHeight: 1.7 }}
            >
              <ReactMarkdown>{claim.reasoningMd}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm subtle">
              No reasoning available yet. Verify to generate it.
            </p>
          )}
        </section>

        {/* Evidence */}
        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <div className="text-sm subtle mb-2">
              Evidence (model-selected passages)
            </div>
            {claim.evidence && claim.evidence.length > 0 ? (
              <div className="text-xs subtle">
                {claim.evidence.length} item(s)
              </div>
            ) : null}
          </div>

          {claim.evidence && claim.evidence.length > 0 ? (
            <div className="grid gap-4">
              {claim.evidence.map((ev: Evidence, idx: number) => (
                <article
                  key={idx}
                  className="rounded-xl p-4"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <MetaChip label={ev.paperTitle ?? "Source PDF"} />
                    {typeof ev.page === "number" ? (
                      <MetaChip label={`Page ${ev.page}`} />
                    ) : null}
                    {ev.section ? (
                      <MetaChip label={`Section ${ev.section}`} />
                    ) : null}
                    {typeof ev.paragraph === "number" ? (
                      <MetaChip label={`Para ${ev.paragraph}`} />
                    ) : null}
                  </div>
                  {ev.excerpt ? (
                    <blockquote
                      className="mt-2 rounded-lg p-3"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px dashed var(--border)",
                        fontSize: "0.95rem",
                        lineHeight: 1.65,
                      }}
                    >
                      “{ev.excerpt}”
                    </blockquote>
                  ) : (
                    <p className="text-sm subtle">No excerpt provided.</p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm subtle">
              No evidence yet. Upload a cited PDF and verify to populate
              evidence.
            </p>
          )}
        </section>

        {/* Suggestions */}
        {isUncitedish(claim.status) && (
          <section className="mt-8">
            <div className="flex items-center justify-between">
              <div className="text-sm subtle mb-2">Suggested citations. (Coming Soon...)</div>
            </div>
            {/* TODO - to build this the backend needs to search with keywords not natural language */}
            {ssLoading && (
              <div className="flex items-center gap-2 rounded-lg bg-neutral-900 p-3 text-sm text-neutral-300">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    d="M4 12a8 8 0 018-8"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>
                Fetching suggestions for citation… please wait
              </div>
            )}

            {!ssLoading && ssError && (
              <div className="rounded-lg bg-neutral-900 p-3 text-sm text-red-400">
                {ssError}
              </div>
            )}

            {!ssLoading &&
              !ssError &&
              (claim.suggestions?.length ?? 0) === 0 && (
                <div className="rounded-lg bg-neutral-900 p-3 text-sm text-neutral-400">
                  No suggestions found for this claim.
                </div>
              )}

            {!ssLoading && !ssError && (claim.suggestions?.length ?? 0) > 0 && (
              <ul className="space-y-2">
                {claim.suggestions!.map((s: Suggestion, i: number) => (
                  <li
                    key={`${s.url || s.title}-${i}`}
                    className="rounded-lg border border-neutral-800 bg-neutral-900 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-neutral-100">
                          {s.title || "Untitled"}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {(s.authors || "Unknown authors") +
                            (s.year ? ` · ${s.year}` : "")}
                        </div>
                      </div>
                      {s.url && (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-200 hover:bg-neutral-800"
                        >
                          View
                          <svg
                            className="h-3 w-3"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M14 3h7v7M21 3l-9 9"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M5 12v7h7"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            className="btn btn-outline"
            onClick={handleSkip}
            disabled={busy}
          >
            Skip
          </button>
          <button className="btn btn-accent" onClick={pickFile} disabled={busy}>
            {busy ? "Verifying..." : "Upload cited PDF & Verify"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f) void handleVerify(f);
              if (e.target) e.target.value = "";
            }}
          />
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
      </div>
    </div>
  );
}

/* ---------- small UI chips ---------- */

function StatusChip({ status }: { status: Claim["status"] }) {
  const chip = getStatusChip(status);
  return (
    <span
      className="rounded-md px-3 py-1 text-xs"
      style={{
        background: chip.bg,
        color: chip.fg,
        border: `1px solid ${chip.bd}`,
      }}
    >
      {chip.label}
    </span>
  );
}

function VerdictBadge({
  verdict,
}: {
  verdict: Exclude<Claim["verdict"], null>;
}) {
  const map: Record<
    Exclude<Claim["verdict"], null>,
    { label: string; bg: string; fg: string; bd: string }
  > = {
    supported: {
      label: "Verified",
      bg: "#10321f",
      fg: "#a8f0c7",
      bd: "#1d6b43",
    },
    partially_supported: {
      label: "Partially",
      bg: "#1d2c49",
      fg: "#b7cdf6",
      bd: "#365792",
    },
    unsupported: {
      label: "Unsupported",
      bg: "#3a1414",
      fg: "#f6a5a7",
      bd: "#b03a40",
    },
    skipped: { label: "Skipped", bg: "#282d3a", fg: "#c7cfdf", bd: "#3a4256" },
  };
  const v = map[verdict];
  return (
    <span
      className="rounded-md px-3 py-1 text-xs"
      style={{ background: v.bg, color: v.fg, border: `1px solid ${v.bd}` }}
    >
      {v.label}
    </span>
  );
}

function MetaChip({ label }: { label: string }) {
  return (
    <span
      className="rounded-md px-2.5 py-0.5 text-xs"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid var(--border)",
        color: "var(--text)",
      }}
    >
      {label}
    </span>
  );
}

function getStatusChip(status: Claim["status"]): {
  label: string;
  bg: string;
  fg: string;
  bd: string;
} {
  switch (status) {
    case "cited":
      return { label: "Cited", bg: "#10321f", fg: "#a8f0c7", bd: "#1d6b43" };
    case "weakly_cited":
      return {
        label: "Weakly cited",
        bg: "#3a2f12",
        fg: "#f2d08b",
        bd: "#b58a2e",
      };
    case "uncited":
      return { label: "Uncited", bg: "#3a1414", fg: "#f6a5a7", bd: "#b03a40" };
    default:
      return { label: "Unknown", bg: "#222833", fg: "#b9c3d9", bd: "#2a3142" };
  }
}

/* ---------- small helpers ---------- */

function dedupeByUrl(list: ReadonlyArray<Suggestion>): Suggestion[] {
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const s of list) {
    const key = s.url || `${s.title}|${s.authors}|${s.year ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}
