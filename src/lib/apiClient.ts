// src/lib/apiClient.ts
import { API_BASE_URL, API_VERSION } from "./config";
import type { Claim, Evidence, StreamEvent } from "./types";

/**
 * Flow:
 * - Centralized client for all backend calls.
 * - Body-only API key (never headers).
 * - Streaming via POST + NDJSON reader with AbortController.
 */

export interface ValidateResult {
    ok: boolean;
    status: number;
    error?: string;
}

class InternalURIs {
    static readonly VALIDATE_API_KEY = "/validate-api-key";
    static readonly UPLOAD_PAPER = "/upload-paper";
    static readonly STREAM_CLAIM = "/stream-claim";
    static readonly VERIFY_CLAIM = "/verify-claim";
}

function joinUrl(...parts: string[]): string {
    return parts
        .filter(Boolean)
        .map((p, i) => (i === 0 ? p.replace(/\/+$/g, "") : p.replace(/^\/+|\/+$/g, "")))
        .join("/");
}

export async function validateClaudeKeyViaBackend(key: string): Promise<ValidateResult> {
    if (key.trim().length === 0) return { ok: false, status: 0, error: "Empty API key." };

    try {
        const res = await fetch(joinUrl(API_BASE_URL, API_VERSION, InternalURIs.VALIDATE_API_KEY), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ apiKey: key }),
            credentials: "include",
        });

        if (res.ok) return { ok: true, status: res.status };

        const msg = await safeErr(res);
        return { ok: false, status: res.status, error: msg || "Invalid API key." };
    } catch (e) {
        const message = e instanceof Error ? e.message : "Network error";
        return { ok: false, status: 0, error: message };
    }
}

export interface UploadPaperResult {
    jobId: string;
}

export async function uploadPaper(file: File, apiKey: string): Promise<UploadPaperResult> {
    if (!file) throw new Error("Missing file.");
    if (!apiKey.trim()) throw new Error("Missing API key.");

    const form = new FormData();
    form.append("file", file);
    form.append("apiKey", apiKey);

    const res = await fetch(joinUrl(API_BASE_URL, API_VERSION, InternalURIs.UPLOAD_PAPER), {
        method: "POST",
        body: form,
    });

    if (!res.ok) {
        const msg = await safeErr(res);
        throw new Error(msg || "Upload failed.");
    }

    const data: UploadPaperResult = await res.json();
    return data;
}

/** Start NDJSON stream and parse line-by-line (returns a cancel fn). */
export function streamClaims(
    params: { jobId: string; apiKey: string },
    onEvent: (evt: StreamEvent) => void,
    onError: (message: string) => void
): { cancel: () => void } {
    const { jobId, apiKey } = params;
    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
        try {
            const res = await fetch(joinUrl(API_BASE_URL, API_VERSION, InternalURIs.STREAM_CLAIM), {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ jobId, apiKey }),
                signal,
            });

            if (!res.ok || !res.body) {
                const msg = !res.ok ? await safeErr(res) : "No response body";
                onError(msg || "Stream failed to start.");
                return;
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffered = "";

            // Read chunks and split on newline boundaries
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffered += decoder.decode(value, { stream: true });
                let newlineIndex: number;
                while ((newlineIndex = buffered.indexOf("\n")) >= 0) {
                    const line = buffered.slice(0, newlineIndex).trim();
                    buffered = buffered.slice(newlineIndex + 1);
                    if (!line) continue;
                    try {
                        const obj = JSON.parse(line) as StreamEvent;
                        onEvent(obj);
                    } catch {
                        onError("Malformed NDJSON line.");
                    }
                }
            }

            // Flush any trailing JSON line (optional)
            const last = buffered.trim();
            if (last.length > 0) {
                try {
                    const obj = JSON.parse(last) as StreamEvent;
                    onEvent(obj);
                } catch {
                    /* ignore */
                }
            }
        } catch (e) {
            if ((e as { name?: string }).name === "AbortError") return;
            const message = e instanceof Error ? e.message : "Network error";
            onError(message);
        }
    })();

    return { cancel: () => controller.abort() };
}

export interface VerifyResult {
    claimId: string;
    verdict: Claim["verdict"];
    confidence: number;
    reasoningMd: string;
    evidence?: ReadonlyArray<Evidence>;
}

export async function verifyClaim(
    jobId: string,
    claimId: string,
    file: File,
    apiKey: string
): Promise<VerifyResult> {
    if (!jobId.trim()) throw new Error("Missing jobId.");
    if (!claimId.trim()) throw new Error("Missing claimId.");
    if (!file) throw new Error("Missing verification PDF.");
    if (!apiKey.trim()) throw new Error("Missing API key.");

    const form = new FormData();
    form.append("jobId", jobId);
    form.append("claimId", claimId);
    form.append("file", file);
    form.append("apiKey", apiKey);

    const res = await fetch(joinUrl(API_BASE_URL, API_VERSION, InternalURIs.VERIFY_CLAIM), {
        method: "POST",
        body: form,
    });

    if (!res.ok) {
        const msg = await safeErr(res);
        throw new Error(msg || "Verify failed.");
    }

    const data: VerifyResult = await res.json();
    return data;
}

/* ---------- helpers ---------- */

async function safeErr(res: Response): Promise<string> {
    // Backend may send:
    //  - { ok:false, error:"file_too_large", maxMb: 10 }
    //  - { ok:false, error:"rate_limited", message:"Too many requests. Try again in 60s." }
    //  - { detail: {...} } (HTTPException)
    //  - { detail: "..." }

    type ErrorShape = {
        ok?: boolean;
        error?: string;
        message?: string;
        maxMb?: number;
        detail?: string | Record<string, unknown>;
    };

    let body: unknown;
    try {
        body = await res.json();
    } catch {
        body = null;
    }

    const retryAfter = res.headers.get("Retry-After");

    if (body && typeof body === "object") {
        const d =
            (body as ErrorShape).detail && typeof (body as ErrorShape).detail === "object"
                ? (body as ErrorShape).detail
                : (body as ErrorShape).detail ?? body;

        if (typeof d === "string") return d;

        if (d && typeof d === "object") {
            const error = (d as ErrorShape).error;
            const message = (d as ErrorShape).message;
            const maxMb = (d as ErrorShape).maxMb;

            if (error === "file_too_large") {
                const mb = typeof maxMb === "number" ? maxMb : 10;
                return `File exceeds ${mb} MB.`;
            }

            if (error === "rate_limited") {
                const tail = retryAfter ? ` Try again in ${retryAfter}s.` : "";
                return message || `Too many requests.${tail}`;
            }

            if (message) return String(message);
            if (error) return String(error);
        }
    }

    return `${res.status} ${res.statusText}`;
}

