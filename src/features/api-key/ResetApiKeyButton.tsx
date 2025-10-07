// src/features/api-key/ResetApiKeyButton.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApiKey } from "./useApiKey";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";

/**
 * Flow:
 * - Button in header to reset key (cannot view the old key).
 * - Opens confirm dialog; on confirm clears store + localStorage, navigates home.
 */
export function ResetApiKeyButton() {
  const [open, setOpen] = useState<boolean>(false);
  const { clearKey, claudeApiKey } = useApiKey();
  const navigate = useNavigate();

  const handleConfirm = () => {
    clearKey();
    setOpen(false);
    navigate("/");
  };

  return (
    <>
      <button
        className="btn btn-outline"
        onClick={() => setOpen(true)}
        aria-disabled={!claudeApiKey}
        title={claudeApiKey ? "Reset the stored API key" : "No key stored"}
      >
        Reset API key
      </button>

      <ConfirmDialog
        open={open}
        title="Reset API key?"
        description="This removes your Claude API key from this device. You'll need to re-enter it to use the dashboard."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
