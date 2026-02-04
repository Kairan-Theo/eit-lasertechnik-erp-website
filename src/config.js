
// Configuration for API endpoints
// You can override this with VITE_API_BASE_URL environment variable
const envUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
const host = window.location.hostname || "";
const isLocalHost = host === "localhost" || host === "127.0.0.1";
const proto = window.location.protocol === "https:" ? "https" : "http";

let resolved;
if (envUrl && typeof envUrl === "string" && envUrl.trim().length > 0) {
  resolved = envUrl.trim();
} else if (!host) {
  resolved = "http://127.0.0.1:8002";
} else if (isLocalHost) {
  resolved = "http://127.0.0.1:8002";
} else {
  resolved = `${proto}://${host}:8002`;
}

export const API_BASE_URL = resolved;

// Google OAuth Client ID
// TODO: Replace this with your actual Google Client ID from Google Cloud Console
// 1. Go to https://console.cloud.google.com/
// 2. Create a project > APIs & Services > Credentials > Create Credentials > OAuth client ID
// 3. Select "Web application", add "http://localhost:5173" to Authorized JavaScript origins
// 4. Copy the Client ID and paste it below
export const GOOGLE_CLIENT_ID = "122374743685-j97ful000l2a6snsgbmdqrg4jataipsk.apps.googleusercontent.com";

console.log("🔌 Connected to Backend at:", API_BASE_URL);

