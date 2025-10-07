// src/features/stream/useClaimsStreams.ts
import { useCallback, useRef, useState } from "react";
import type { Claim, StreamEvent } from "../../lib/types";
import { streamClaims } from "../../lib/apiClient";

/**
 * Flow:
 * - Start/stop are stable (useCallback with empty deps).
 * - Guards against starting the same job twice.
 * - Uses an internal ref map so new claims don't recreate `start`.
 */
export function useClaimsStream() {
    const cancelRef = useRef<(() => void) | null>(null);
    const activeJobRef = useRef<string | null>(null);
    const mapRef = useRef<Map<string, Claim>>(new Map());

    const [claims, setClaims] = useState<ReadonlyArray<Claim>>([]);
    const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);
    const [error, setError] = useState<string>("");

    const stop = useCallback(() => {
        cancelRef.current?.();
        cancelRef.current = null;
        activeJobRef.current = null;
    }, []);

    const start = useCallback((jobId: string, apiKey: string) => {
        if (!jobId || !apiKey) return;

        // same job? do nothing
        if (activeJobRef.current === jobId) return;

        // different active job? stop it first
        if (activeJobRef.current && activeJobRef.current !== jobId) {
            stop();
        }

        setError("");
        activeJobRef.current = jobId;
        // seed map from current UI state once
        if (mapRef.current.size === 0 && claims.length > 0) {
            const seed = new Map<string, Claim>();
            for (const c of claims) seed.set(c.id, c);
            mapRef.current = seed;
        }

        const { cancel } = streamClaims(
            { jobId, apiKey },
            (evt: StreamEvent) => {
                if (evt.type === "claim") {
                    mapRef.current.set(evt.payload.id, evt.payload);
                    setClaims(Array.from(mapRef.current.values()));
                } else if (evt.type === "progress") {
                    setProgress({ processed: evt.payload.processed, total: evt.payload.total });
                } else if (evt.type === "error") {
                    setError(evt.payload.message);
                }
            },
            (message) => setError(message || "Stream failed.")
        );
        cancelRef.current = cancel;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // no claims/stop deps -> stable across renders

    // allow parent to push updated claims (e.g., after verify)
    const setClaimsExternal = useCallback((next: ReadonlyArray<Claim>) => {
        mapRef.current = new Map(next.map((c) => [c.id, c]));
        setClaims(next);
    }, []);

    return { claims, progress, error, start, stop, setClaims: setClaimsExternal, setProgress, setError };
}
