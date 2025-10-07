// src/components/claims/ClaimList.tsx
import { ClaimRow } from "./ClaimRow";
import type { Claim } from "../../lib/types";

interface ClaimListProps {
  claims: ReadonlyArray<Claim>;
}

/**
 * Flow comment:
 * Displays the streamed claims as a vertical list.
 * Each row shows status chip and Markdown text (simple for now).
 * Future: clicking a row opens a detail panel for verification actions.
 */
export function ClaimList({ claims }: ClaimListProps) {
  if (claims.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-bg-secondary p-6 text-center text-text-secondary">
        Claims will appear here as they are extracted.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {claims.map((c) => (
        <ClaimRow key={c.id} claim={c} />
      ))}
    </div>
  );
}
