// src/lib/types.ts
export type ClaimStatus = "cited" | "uncited" | "weakly_cited";
export type Verdict = "supported" | "partially_supported" | "unsupported" | "skipped" | null;

export interface Suggestion {
    title: string;
    url: string;
    venue?: string;
    year?: number;
}

export interface Evidence {
  paperTitle?: string | null;
  page?: number | null;
  section?: string | null;
  paragraph?: number | null;
  excerpt?: string | null;
}

export interface Claim {
    id: string;
    text: string;
    status: ClaimStatus;
    verdict: Verdict;
    evidence?: ReadonlyArray<Evidence>;
    confidence?: number;
    reasoningMd?: string;
    suggestions?: ReadonlyArray<Suggestion>;
    sourceUploaded?: boolean;
}

export interface Job {
    id: string;
    status: "pending" | "processing" | "streaming" | "done" | "error";
    processed?: number;
    total?: number;
}

export type ProgressPhase = "parse" | "extract" | "index" | "verify";
export interface ProgressPayload {
  phase: ProgressPhase;
  processed: number;
  total: number;
  ts: number; // epoch seconds
}

export type StreamEvent =
    | { type: "claim"; payload: Claim }
    | { type: "update"; payload: { claimId: string; patch: Partial<Claim> } }
    | { type: "progress"; payload: ProgressPayload }
    | { type: "done" }
    | { type: "error"; payload: { message: string } };
