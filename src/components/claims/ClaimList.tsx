// src/components/claims/ClaimList.tsx
import { ClaimRow } from "./ClaimRow";
import type { Claim } from "../../lib/types";

interface ClaimListProps {
  claims: ReadonlyArray<Claim>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ClaimList({ claims, selectedId, onSelect }: ClaimListProps) {
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
        <button
          key={c.id}
          onClick={() => onSelect(c.id)}
          className="w-full text-left"
          aria-label={`Open details for claim ${c.id}`}
        >
          <ClaimRow claim={c} selected={selectedId === c.id} />
        </button>
      ))}
    </div>
  );
}
