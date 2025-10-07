// src/lib/http.ts
import type { Claim, Job, StreamEvent } from "./types";

/**
 * Flow comment:
 * http.ts is a centralized place for API calls.
 * For now, we mock endpoints so the UI flows end-to-end.
 * Later, replace these with real fetch() calls to your FastAPI.
 */
export interface UploadPaperParams {
    file: File;
    claudeApiKey: string;
}

export interface UploadPaperResult {
    job: Job;
}

export async function uploadPaper(params: UploadPaperParams): Promise<UploadPaperResult> {
    const { file, claudeApiKey } = params;
    if (!file || !claudeApiKey) {
        throw new Error("Missing file or API key.");
    }

    // TODO: replace with real backend call
    // const res = await fetch("/upload-paper", { ... });
    // return (await res.json()) as UploadPaperResult;

    return Promise.resolve({
        job: { id: crypto.randomUUID(), status: "streaming", processed: 0, total: 5 },
    });
}

export interface StreamClaimsParams {
    jobId: string;
    claudeApiKey: string;
}

/**
 * Mock NDJSON stream generator for demo.
 * Replace with fetch(`/stream-claims?jobId=${jobId}`) and pipe reader.
 */
export async function streamClaims(
    params: StreamClaimsParams,
    onEvent: (event: StreamEvent) => void
): Promise<void> {
    const { jobId, claudeApiKey } = params;
    if (!jobId || !claudeApiKey) {
        throw new Error("Missing jobId or API key.");
    }

    const demoClaims: Claim[] = [
        {
            id: "c1",
            text: "Transformers outperform RNNs on translation tasks.",
            status: "cited",
            verdict: null,
            confidence: undefined,
            suggestions: [],
            sourceUploaded: false,
        },
        {
            id: "c2",
            text: "Pretraining improves zero-shot performance in most language tasks.",
            status: "weakly_cited",
            verdict: null,
        },
        {
            id: "c3",
            text: "Graph neural networks strictly dominate CNNs for all vision tasks.",
            status: "uncited",
            verdict: null,
            suggestions: [
                { title: "Do GNNs Dream of CNNs?", url: "https://example.org/gnn", venue: "ArXiv", year: 2022 },
                { title: "Inductive Bias in GNNs", url: "https://example.org/inductive", venue: "ICLR", year: 2021 },
                { title: "CNN vs GNN survey", url: "https://example.org/survey", venue: "TPAMI", year: 2020 },
            ],
        },
    ];

    // Simulate streamed events
    for (let i = 0; i < demoClaims.length; i += 1) {
        const claim = demoClaims[i];
        onEvent({ type: "claim", payload: claim });
        onEvent({ type: "progress", payload: { processed: i + 1, total: demoClaims.length } });
        await new Promise((r) => setTimeout(r, 450));
    }
    onEvent({ type: "done" });
}
