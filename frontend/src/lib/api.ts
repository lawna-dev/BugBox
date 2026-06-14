const RAW_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:5080";
export const API_BASE = RAW_BASE.replace(/\/$/, "");

const TOKEN_KEY = "bugbox.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(t: string | null) {
  if (typeof window === "undefined") return;
  if (t) window.localStorage.setItem(TOKEN_KEY, t);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch (e) {
    throw new ApiError(
      `Cannot reach the BugBox API at ${API_BASE}. Start the backend with 'dotnet run' in backend/BugBox.Api.`,
      0,
    );
  }
  if (res.status === 204) return undefined as unknown as T;
  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const msg = (data && (data.error || data.title)) || res.statusText || "Request failed";
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

function safeJson(t: string) { try { return JSON.parse(t); } catch { return t; } }
