// src/components/claims/ClaimRow.tsx
import ReactMarkdown from "react-markdown";
import type { Claim } from "../../lib/types";
type VerdictStrict = Exclude<Claim["verdict"], null>;

interface ClaimRowProps {
  claim: Claim;
  selected?: boolean;
}

export function ClaimRow({ claim, selected = false }: ClaimRowProps) {
  const chip = getStatusChip(claim.status);

  return (
    <div
      className="card p-4 hover:brightness-110"
      style={selected ? { outline: `2px solid var(--accent)` } : undefined}
    >
      <div className="mb-2 flex items-center gap-2">
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
        {claim.verdict ? (
          <VerdictBadge verdict={claim.verdict as VerdictStrict} />
        ) : null}
      </div>

      <div className="prose prose-invert max-w-none prose-p:my-0">
        <ReactMarkdown>{claim.text}</ReactMarkdown>
      </div>
    </div>
  );
}

/* ... keep getStatusChip and VerdictBadge from your previous version ... */
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

function VerdictBadge({ verdict }: { verdict: VerdictStrict }) {
  const map: Record<
    VerdictStrict,
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
