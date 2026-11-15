const TOKEN_KEY = "akash-lms-token";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError("Network error. Check your connection and API URL.", 0);
  }
  const json = await response.json().catch(() => ({ success: false, error: { message: "Invalid server response" } }));
  if (response.status === 401 && !path.startsWith("/api/auth/")) {
    setToken(null);
  }
  if (!response.ok || json.success === false) {
    throw new ApiError(json.error?.message || "Request failed", response.status);
  }
  return json as T;
}

export type ListResponse<T> = {
  success: true;
  data: T[];
  meta: { page: number; limit: number; total: number; pages: number };
};

export type ItemResponse<T> = { success: true; data: T };

export function qs(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}
