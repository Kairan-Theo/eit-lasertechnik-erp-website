
// Configuration for API endpoints
// You can override this with VITE_API_URL environment variable
export const API_BASE_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:8000"
    : `http://${window.location.hostname}:8001`
);

console.log("🔌 Connected to Backend at:", API_BASE_URL);

