// src/features/api-key/ApiKeyModal.tsx
import { useEffect, useRef, useState } from "react";
import { useApiKey } from "./useApiKey";

interface ApiKeyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Flow:
 * - Solid, opaque modal with clear disclosure
 * - Masked password input with focus ring
 * - Remember on device toggle (sessionStorage)
 */
export function ApiKeyModal({ open, onClose, onSuccess }: ApiKeyModalProps) {
  const { setKey } = useApiKey();
  const [value, setValue] = useState<string>("");
  const [remember, setRemember] = useState<boolean>(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  if (!open) return null;

  const disabled = value.trim().length === 0;

  const handleSave = () => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    setKey(trimmed, remember);
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center"
      style={{
        background: "rgba(0,0,0,0.6)",
      }} /* only the backdrop is translucent */
    >
      <div className="w-full max-w-lg card p-6">
        <h2 className="mb-1 text-2xl font-semibold">
          Enter your Claude API key
        </h2>
        <p className="mb-4 text-sm subtle">
          We do not store your key on any server. It stays on your device and is
          attached to requests from your browser.
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
            <button className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button
              className={`btn ${disabled ? "btn-outline" : "btn-accent"}`}
              onClick={handleSave}
              disabled={disabled}
            >
              Save & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
