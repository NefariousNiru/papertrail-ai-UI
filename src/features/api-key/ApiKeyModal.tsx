// src/features/api-key/ApiKeyModal.tsx
import { useEffect, useRef, useState } from "react";
import { useApiKey } from "./useApiKey";
import { validateClaudeKeyViaBackend } from "../../lib/http";

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Flow:
 * - Frontend validates via backend endpoint to avoid CORS.
 * - On 2xx → save key; on 4xx → show invalid; on network → show clear message.
 */
export function ApiKeyModal({ open, onClose, onSuccess }: ApiKeyModalProps) {
  const { setKey } = useApiKey();
  const [value, setValue] = useState<string>("");
  const [remember, setRemember] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setError("");
      setSubmitting(false);
      inputRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  const disabled = value.trim().length === 0 || submitting;

  const handleSave = async () => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;

    setSubmitting(true);
    setError("");

    const result = await validateClaudeKeyViaBackend(trimmed);

    if (result.ok) {
      setKey(trimmed, remember);
      setSubmitting(false);
      onClose();
      onSuccess?.();
      return;
    }

    const msg =
      result.status >= 400 && result.status < 500
        ? "Invalid Claude API key. Please check and try again."
        : result.status === 0
        ? "Oops! Could not reach server. Try again later."
        : result.error || "Validation failed.";
    setError(msg);
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Enter your Claude API key"
    >
      <div className="card w-full max-w-lg p-6">
        <h2 className="mb-1 text-2xl font-semibold">
          Enter your Claude API key
        </h2>
        <p className="mb-4 text-sm subtle">
          We do not store your key on any server. It stays on your device and is
          attached in the body of requests from your browser.
        </p>

        <label htmlFor="apiKey" className="text-sm subtle">
          Claude API key
        </label>
        <input
          ref={inputRef}
          id="apiKey"
          type="password"
          inputMode="text"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value ?? "")}
          className="input mt-2"
          placeholder="sk-..."
          aria-invalid={error.length > 0}
        />

        <div className="mt-3 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm subtle">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(Boolean(e.target.checked))}
              style={{ accentColor: "var(--accent)" }}
            />
            Remember on this device
          </label>

          <div className="flex gap-2">
            <button
              className="btn btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className={`btn ${disabled ? "btn-outline" : "btn-accent"}`}
              onClick={() => void handleSave()}
              disabled={disabled}
            >
              {submitting ? "Validating..." : "Save & Continue"}
            </button>
          </div>
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
