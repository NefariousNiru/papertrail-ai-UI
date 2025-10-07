// src/features/upload/PaperUploadCard.tsx
import { useRef, useState } from "react";
import { uploadPaper } from "../../lib/apiClient";
import { useApiKey } from "../api-key/useApiKey";

interface PaperUploadCardProps {
  onJob: (jobId: string) => void;
}

/**
 * Flow:
 * - Pick file → POST /upload-paper → returns jobId.
 * - Save jobId to localStorage for resume and inform parent to start stream.
 */
export function PaperUploadCard({ onJob }: PaperUploadCardProps) {
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
      const { jobId } = await uploadPaper(file, claudeApiKey);
      localStorage.setItem("papertrail_job_id", jobId);
      onJob(jobId);
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
