// src/lib/http.ts
import { API_BASE_URL } from "./config";
import type { Claim, Job, StreamEvent } from "./types";

/* ---------------- existing mocks (keep) ---------------- */

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

    // TODO: Replace with real backend call
    return Promise.resolve({
        job: { id: crypto.randomUUID(), status: "streaming", processed: 0, total: 5 },
    });
}

export interface StreamClaimsParams {
    jobId: string;
    claudeApiKey: string;
}

export async function streamClaims(
    params: StreamClaimsParams,
    onEvent: (event: StreamEvent) => void
): Promise<void> {
    const { jobId, claudeApiKey } = params;
    if (!jobId || !claudeApiKey) throw new Error("Missing jobId or API key.");

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

    for (let i = 0; i < demoClaims.length; i += 1) {
        onEvent({ type: "claim", payload: demoClaims[i] });
        onEvent({ type: "progress", payload: { processed: i + 1, total: demoClaims.length } });
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 450));
    }
    onEvent({ type: "done" });
}

/* ---------------- backend validator (new) ---------------- */

export interface ValidateResult {
    ok: boolean;
    status: number;
    error?: string;
}

/**
 * Flow:
 * - POST to your backend validator (body-only API key).
 * - Treat any 2xx as valid; 4xx as invalid; others as error.
 * - Endpoint contract (recommended):
 *   - 200 OK: { ok: true }
 *   - 400/401/403: { ok: false, error?: string }
 */
export async function validateClaudeKeyViaBackend(key: string): Promise<ValidateResult> {
    const payload = { apiKey: key };
    if (key.trim().length === 0) return { ok: false, status: 0, error: "Empty API key." };

    try {
        const res = await fetch(`${API_BASE_URL}/validate-key`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
            // Note: do NOT put the key in headers; keep it in body per your policy.
            credentials: "include", // harmless if same-origin; useful if you add auth later
        });

        if (res.ok) {
            return { ok: true, status: res.status };
        }

        let msg = "";
        try {
            const data: { ok?: boolean; error?: string } = await res.json();
            msg = data.error ?? "";
        } catch {
            msg = await res.text();
        }
        return { ok: false, status: res.status, error: msg || "Invalid API key." };
    } catch (e) {
        const message = e instanceof Error ? e.message : "Network error";
        return { ok: false, status: 0, error: message };
    }
}
