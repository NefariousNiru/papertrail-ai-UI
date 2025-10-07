// src/lib/types.ts
export type ClaimStatus = "cited" | "uncited" | "weakly_cited";
export type Verdict = "supported" | "partially_supported" | "unsupported" | "skipped" | null;

export interface Suggestion {
    title: string;
    url: string;
    venue?: string;
    year?: number;
}

export interface Claim {
    id: string;
    text: string;
    status: ClaimStatus;
    verdict: Verdict;
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

export type StreamEvent =
    | { type: "claim"; payload: Claim }
    | { type: "update"; payload: { claimId: string; patch: Partial<Claim> } }
    | { type: "progress"; payload: { processed: number; total: number } }
    | { type: "done" }
    | { type: "error"; payload: { message: string } };
