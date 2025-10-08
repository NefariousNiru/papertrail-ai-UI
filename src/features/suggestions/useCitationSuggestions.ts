// src/features/suggestions/useCitationSuggestions.ts
import { useCallback, useRef, useState } from "react";
import { suggestCitations } from "../../lib/apiClient";
import type { Suggestion } from "../../lib/types";

export function useCitationSuggestions() {
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [error, setError] = useState<string | null>(null);

    // simple dedupe so we don't refetch the same claim text repeatedly
    const lastKeyRef = useRef<string>("");

    const fetchForText = useCallback(async (claimText: string | undefined | null) => {
        if (!claimText) return;
        const key = claimText.trim();
        if (!key || key === lastKeyRef.current) return;

        lastKeyRef.current = key;
        setLoading(true);
        setError(null);

        try {
            const items = await suggestCitations(key);
            setSuggestions(items);
        } catch {
            setError("Could not fetch suggestions.");
            setSuggestions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const reset = useCallback(() => {
        lastKeyRef.current = "";
        setSuggestions([]);
        setError(null);
        setLoading(false);
    }, []);

    return { loading, suggestions, error, fetchForText, reset };
}
