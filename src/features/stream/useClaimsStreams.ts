// src/features/stream/useClaimsStreams.ts
import { useCallback, useRef, useState } from "react";
import type { Claim, StreamEvent, ProgressPayload } from "../../lib/types";
import { streamClaims } from "../../lib/apiClient";

/**
 * Stream manager:
 * - Resets state on new job (so old claims vanish when you upload again)
 * - Tracks "done" so the progress bar can show Completed
 * - Internal mapRef avoids quadratic re-renders
 */
export function useClaimsStream() {
    const cancelRef = useRef<(() => void) | null>(null);
    const activeJobRef = useRef<string | null>(null);
    const mapRef = useRef<Map<string, Claim>>(new Map());

    const [claims, setClaims] = useState<ReadonlyArray<Claim>>([]);
    const [progress, setProgress] = useState<ProgressPayload | null>(null);
    const [error, setError] = useState<string>("");
    const [isDone, setIsDone] = useState<boolean>(false);

    const stop = useCallback(() => {
        cancelRef.current?.();
        cancelRef.current = null;
        activeJobRef.current = null;
    }, []);

    const resetState = useCallback(() => {
        mapRef.current = new Map();
        setClaims([]);
        setProgress(null);
        setError("");
        setIsDone(false);
    }, []);

    const start = useCallback((jobId: string, apiKey: string) => {
        if (!jobId || !apiKey) return;

        // same job: ignore
        if (activeJobRef.current === jobId) return;

        // switching jobs: stop & hard reset
        if (activeJobRef.current && activeJobRef.current !== jobId) {
            stop();
            resetState();
        } else {
            // first start this session
            resetState();
        }

        setError("");
        activeJobRef.current = jobId;

        const { cancel } = streamClaims(
            { jobId, apiKey },
            (evt: StreamEvent) => {
                if (evt.type === "claim") {
                    mapRef.current.set(evt.payload.id, evt.payload);
                    setClaims(Array.from(mapRef.current.values()));
                } else if (evt.type === "progress") {
                    setProgress(evt.payload);
                    setIsDone(false);
                } else if (evt.type === "done") {
                    setIsDone(true);
                } else if (evt.type === "error") {
                    setError(evt.payload.message);
                }
            },
            (message) => setError(message || "Stream failed.")
        );
        cancelRef.current = cancel;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // allow parent to push updated claims (e.g., after verify)
    const setClaimsExternal = useCallback((next: ReadonlyArray<Claim>) => {
        mapRef.current = new Map(next.map((c) => [c.id, c]));
        setClaims(next);
    }, []);

    return {
        claims,
        progress,
        error,
        isDone,
        start,
        stop,
        setClaims: setClaimsExternal,
        setProgress,
        setError,
    };
}

