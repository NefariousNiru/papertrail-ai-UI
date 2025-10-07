// src/lib/export.ts
import type { Claim } from "./types";

/**
 * Flow:
 * - Simple client-side export so users can keep results (no server persistence).
 */

export function downloadJSON(claims: ReadonlyArray<Claim>) {
    const blob = new Blob([JSON.stringify(claims, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    trigger(url, "papertrail_claims.json");
}

export function downloadMarkdown(claims: ReadonlyArray<Claim>) {
    const md = renderClaimsMd(claims);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    trigger(url, "papertrail_claims.md");
}

function trigger(url: string, filename: string) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function renderClaimsMd(claims: ReadonlyArray<Claim>): string {
    const lines: string[] = ["# PaperTrail AI — Claims Report", ""];
    for (const c of claims) {
        lines.push(`## ${badge(c.status)} ${escapeMd(c.text)}`);
        if (c.verdict) lines.push(`- **Verdict:** ${c.verdict}`);
        if (typeof c.confidence === "number") lines.push(`- **Confidence:** ${c.confidence.toFixed(2)}`);
        if (c.reasoningMd) {
            lines.push("", "### Reasoning", c.reasoningMd);
        }
        lines.push("");
    }
    return lines.join("\n");
}

function badge(status: Claim["status"]): string {
    switch (status) {
        case "cited": return "🟩";
        case "weakly_cited": return "🟨";
        case "uncited": return "🟥";
    }
}

function escapeMd(s: string): string {
    return s.replace(/([*_`])/g, "\\$1");
}
