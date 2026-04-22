const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");
const WS_BASE_URL = (process.env.NEXT_PUBLIC_WS_BASE_URL ?? "").replace(/\/$/, "");

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function wsUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (WS_BASE_URL) {
    return `${WS_BASE_URL}${normalizedPath}`;
  }

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}${normalizedPath}`;
  }

  return normalizedPath;
}