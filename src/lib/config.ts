// src/lib/config.ts
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL

if (!rawBaseUrl || typeof rawBaseUrl !== "string" || !/^https?:\/\//.test(rawBaseUrl)) {
    throw new Error(
        "Invalid or missing VITE_API_BASE_URL. " +
        "Set it in your .env file (must start with http:// or https://)."
    )
}

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, "")
export const API_VERSION = "/api/v1"