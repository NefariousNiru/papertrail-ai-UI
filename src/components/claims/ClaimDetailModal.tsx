// src/components/claims/ClaimDetailModal.tsx
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Claim, Evidence } from "../../lib/types";
import { verifyClaim } from "../../lib/apiClient";
import { useApiKey } from "../../features/api-key/useApiKey";

/**
 * Flow:
 * - Modal card instead of side panel: focuses attention, better contrast.
 * - Actions: "Upload cited PDF & Verify" + "Skip".
 * - Shows verdict, confidence, reasoning, and any evidence references.
 */
interface ClaimDetailModalProps {
  claim: Claim | null;
  onClose: () => void;
  onUpdate: (updated: Claim) => void;
}

export function ClaimDetailModal({
  claim,
  onClose,
  onUpdate,
}: ClaimDetailModalProps) {
  const { claudeApiKey } = useApiKey();
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (!claim) return null;

  const pickFile = () => inputRef.current?.click();

  const handleVerify = async (file: File) => {
    if (!claudeApiKey) {
      setError("API key missing.");
      return;
    }
    if (file.size === 0) {
      setError("Selected file is empty.");
      return;
    }
    setError("");
    setBusy(true);

    const jobId = localStorage.getItem("papertrail_job_id") || "";
    if (!jobId) {
      setError("Missing job context. Please re-upload the paper.");
      setBusy(false);
      return;
    }

    try {
      const res = await verifyClaim(jobId, claim.id, file, claudeApiKey);
      onUpdate({
        ...claim,
        verdict: res.verdict,
        confidence: res.confidence,
        reasoningMd: res.reasoningMd,
        sourceUploaded: true,
        // evidence stays as-is for now (backend can populate later)
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Verification failed.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = () => {
    onUpdate({
      ...claim,
      verdict: "skipped",
      reasoningMd:
        claim.reasoningMd ?? "User chose to skip verification for this claim.",
      sourceUploaded: claim.sourceUploaded ?? false,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center px-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Claim details"
      onClick={(e) => {
        // close when clicking backdrop
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card w-full max-w-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm subtle mb-1">Claim</div>
            <div className="text-base">{claim.text}</div>
          </div>
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>

        {/* Status row */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusChip status={claim.status} />
          {claim.verdict ? <VerdictBadge verdict={claim.verdict} /> : null}
          {typeof claim.confidence === "number" ? (
            <span
              className="rounded-md px-2 py-0.5 text-xs subtle"
              style={{ border: "1px solid var(--border)" }}
            >
              Confidence: {claim.confidence.toFixed(2)}
            </span>
          ) : null}
        </div>

        {/* Evidence / Reasoning */}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <section>
            <div className="text-sm subtle mb-2">Reasoning</div>
            {claim.reasoningMd ? (
              <div className="prose prose-invert max-w-none prose-p:my-2">
                <ReactMarkdown>{claim.reasoningMd}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm subtle">
                No reasoning available yet. Verify to generate it.
              </p>
            )}
          </section>

          <section>
            <div className="text-sm subtle mb-2">Evidence references</div>
            {claim.evidence && claim.evidence.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {claim.evidence.map((ev: Evidence, idx: number) => (
                  <li
                    key={idx}
                    className="rounded-lg p-2"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <div className="font-medium">
                      {ev.paperTitle ?? "Source PDF"}
                    </div>
                    <div className="subtle">
                      {ev.section ? `Section: ${ev.section}` : ""}
                      {typeof ev.paragraph === "number"
                        ? ` · Para ${ev.paragraph}`
                        : ""}
                      {typeof ev.page === "number" ? ` · Page ${ev.page}` : ""}
                    </div>
                    {ev.excerpt ? (
                      <blockquote className="mt-1 text-xs italic">
                        &ldquo;{ev.excerpt}&rdquo;
                      </blockquote>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm subtle">
                No explicit references provided. (Backend can return evidence[]
                later.)
              </p>
            )}
          </section>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
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
              // reset input so re-selecting the same file works
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

/* --- small UI chips reused --- */
function StatusChip({ status }: { status: Claim["status"] }) {
  const chip = getStatusChip(status);
  return (
    <span
      className="rounded-md px-2 py-0.5 text-xs"
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
      className="rounded-md px-2 py-0.5 text-xs"
      style={{ background: v.bg, color: v.fg, border: `1px solid ${v.bd}` }}
    >
      {v.label}
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
