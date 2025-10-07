// src/components/claims/ClaimDetailPanel.tsx
import { useRef, useState } from "react";
import type { Claim } from "../../lib/types";
import { verifyClaim } from "../../lib/apiClient";
import { useApiKey } from "../../features/api-key/useApiKey";

/**
 * Flow:
 * - Right-side panel for a selected claim.
 * - Upload cited PDF → verify → emit verdict up to parent.
 */
interface ClaimDetailPanelProps {
  claim: Claim | null;
  onClose: () => void;
  onUpdate: (updated: Claim) => void;
}

export function ClaimDetailPanel({
  claim,
  onClose,
  onUpdate,
}: ClaimDetailPanelProps) {
  const { claudeApiKey } = useApiKey();
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  if (!claim) return null;

  const onPick = () => inputRef.current?.click();

  const onFile = async (file: File) => {
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

    try {
      const res = await verifyClaim(claim.id, file, claudeApiKey);
      onUpdate({
        ...claim,
        verdict: res.verdict,
        confidence: res.confidence,
        reasoningMd: res.reasoningMd,
        sourceUploaded: true,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Verification failed.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside
      className="fixed right-0 top-0 z-40 h-full w-full max-w-md border-l"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div
        className="flex items-center justify-between border-b p-4"
        style={{ borderColor: "var(--border)" }}
      >
        <h3 className="text-lg font-semibold">Claim details</h3>
        <button className="btn btn-outline" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="p-4">
        <div className="text-sm subtle mb-1">Claim</div>
        <div className="text-base">{claim.text}</div>

        <div className="mt-4">
          <div className="text-sm subtle">Actions</div>
          <button
            className="btn btn-accent mt-2"
            onClick={onPick}
            disabled={busy}
          >
            {busy ? "Verifying..." : "Upload cited PDF & Verify"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              if (f) void onFile(f);
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

        {claim.reasoningMd && (
          <div className="mt-4">
            <div className="text-sm subtle mb-1">Reasoning</div>
            <pre
              className="whitespace-pre-wrap text-sm"
              style={{ color: "var(--muted)" }}
            >
              {claim.reasoningMd}
            </pre>
          </div>
        )}
      </div>
    </aside>
  );
}
