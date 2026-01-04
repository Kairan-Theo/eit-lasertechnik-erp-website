
// Configuration for API endpoints
// You can override this with VITE_API_URL environment variable
const envUrl = import.meta.env.VITE_API_URL;
const host = window.location.hostname || "";
const isLocalHost = host === "localhost" || host === "127.0.0.1";
const proto = window.location.protocol === "https:" ? "https" : "http";

let resolved;
if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
  resolved = envUrl.trim();
} else if (!host) {
  // Handle file:// pages where hostname is empty
  resolved = "http://127.0.0.1:8000";
} else if (isLocalHost) {
  resolved = "http://127.0.0.1:8000";
} else {
  // Use current protocol to avoid mixed-content blocks when the page is https
  resolved = `${proto}://${host}:8000`;
}

export const API_BASE_URL = resolved;

console.log("🔌 Connected to Backend at:", API_BASE_URL);
