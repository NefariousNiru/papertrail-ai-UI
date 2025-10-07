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
        const status = statusEmoji(c.status);
        const header = `${status} ${escapeMd(c.text)}`;
        lines.push(`## ${header}`);

        lines.push(`- **Status:** ${c.status}`);
        if (c.verdict) lines.push(`- **Verdict:** ${c.verdict}`);
        if (typeof c.confidence === "number") lines.push(`- **Confidence:** ${c.confidence.toFixed(2)}`);

        if (c.evidence && c.evidence.length > 0) {
            lines.push("", "### Evidence");
            for (const ev of c.evidence) {
                const bits: string[] = [];
                if (ev.section) bits.push(`Section ${ev.section}`);
                if (typeof ev.paragraph === "number") bits.push(`Para ${ev.paragraph}`);
                if (typeof ev.page === "number") bits.push(`Page ${ev.page}`);
                const where = bits.length ? ` (${bits.join(", ")})` : "";
                const title = ev.paperTitle ?? "Source PDF";
                lines.push(`- ${title}${where}${ev.excerpt ? ` — “${escapeMd(ev.excerpt)}”` : ""}`);
            }
        }

        if (c.reasoningMd) {
            lines.push("", "### Reasoning", c.reasoningMd);
        }

        lines.push(""); // spacer
    }
    return lines.join("\n");
}

function statusEmoji(s: Claim["status"]): string {
    switch (s) {
        case "cited": return "🟩";
        case "weakly_cited": return "🟨";
        case "uncited": return "🟥";
    }
}

function escapeMd(s: string): string {
    return s.replace(/([*_`])/g, "\\$1");
}
