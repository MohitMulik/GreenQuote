const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL;

// In browser: use relative path if NEXT_PUBLIC_API_URL is empty (same-origin Next.js API).
// In SSR/Node: use absolute URL pointing to local server or configured API URL.
export const API_URL =
  typeof window !== "undefined"
    ? (rawBaseUrl ? rawBaseUrl.replace(/\/+$/, "").replace(/\/v1$/, "") : "")
    : (rawBaseUrl ? rawBaseUrl.replace(/\/+$/, "").replace(/\/v1$/, "") : `http://localhost:${process.env.PORT || 3000}`);

export async function apiFetch(path: string, init: RequestInit = {}) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_URL}${normalizedPath}`;
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  return response;
}
