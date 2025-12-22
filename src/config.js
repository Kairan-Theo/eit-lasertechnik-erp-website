
// Configuration for API endpoints
// You can override this with VITE_API_URL environment variable
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

console.log("🔌 Connected to Backend at:", API_BASE_URL);

