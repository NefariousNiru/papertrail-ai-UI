// src/components/common/ConfirmDialog.tsx
import type { PropsWithChildren } from "react";

interface ConfirmDialogProps extends PropsWithChildren {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Flow:
 * - Simple solid modal used for destructive actions (e.g., reset API key).
 * - Opaque surfaces, clear border, no transparency in the card.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  children,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="card w-full max-w-md p-6">
        <h2 id="confirm-title" className="text-xl font-semibold">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm subtle">{description}</p>
        ) : null}
        {children ? <div className="mt-3">{children}</div> : null}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button className="btn btn-outline" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="btn btn-accent" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
