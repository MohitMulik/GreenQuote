const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
// Normalize base URL: strip trailing slashes and any trailing /v1 to prevent duplicate /v1/v1 paths
export const API_URL = rawBaseUrl.replace(/\/+$/, "").replace(/\/v1$/, "");

export async function apiFetch(path: string, init: RequestInit = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${API_URL}${normalizedPath}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  return response;
}
