// src/features/upload/PaperUploadCard.tsx
import { useRef, useState } from "react";
import { uploadPaper, streamClaims } from "../../lib/http";
import { useApiKey } from "../api-key/useApiKey";
import type { Claim } from "../../lib/types";

interface PaperUploadCardProps {
  onClaims: (claims: ReadonlyArray<Claim>) => void;
  onProgress: (p: { processed: number; total: number }) => void;
}

/**
 * Flow:
 * - Pick file, start mock upload, stream claims
 * - Solid surfaces with clear borders and visible error state
 */
export function PaperUploadCard({
  onClaims,
  onProgress,
}: PaperUploadCardProps) {
  const { claudeApiKey } = useApiKey();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");

  const inputRef = useRef<HTMLInputElement | null>(null);
  const handlePick = () => inputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!claudeApiKey) {
      setError("API key missing. Please set your Claude API key on Home.");
      return;
    }
    if (file.size === 0) {
      setError("Selected file is empty.");
      return;
    }
    setError(null);
    setBusy(true);
    setFileName(file.name);

    try {
      const { job } = await uploadPaper({ file, claudeApiKey });
      const buffered: Claim[] = [];

      await streamClaims({ jobId: job.id, claudeApiKey }, (event) => {
        if (event.type === "claim") {
          buffered.push(event.payload);
          onClaims([...buffered]);
        } else if (event.type === "progress") {
          onProgress({
            processed: event.payload.processed,
            total: event.payload.total,
          });
        } else if (event.type === "error") {
          setError(event.payload.message);
        }
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-4">
      <div className="text-sm subtle">Upload a paper</div>
      <div
        className="mt-3 rounded-xl border border-dashed p-6 text-center"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <p className="subtle">PDF or DOCX</p>
        <button
          className="btn btn-accent mt-3"
          onClick={handlePick}
          disabled={busy}
        >
          {busy ? "Uploading..." : "Choose file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (f) void handleFile(f);
          }}
        />
        {fileName && (
          <div className="mt-2 text-xs subtle">Selected: {fileName}</div>
        )}
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
  );
}
