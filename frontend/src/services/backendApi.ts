import { supabase } from "@/integrations/supabase/client";

export class BackendApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
    this.details = details;
  }
}

const getBackendBaseUrl = (): string => {
  const configured = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "");
  if (configured) return configured;

  // Fallback to same-origin API path when frontend and backend are served behind one domain.
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  throw new Error("Missing VITE_BACKEND_URL environment variable.");
};

const getAuthToken = async (): Promise<string | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.access_token || null;
};

interface BackendRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
}

export const backendRequest = async <T>(
  path: string,
  options: BackendRequestOptions = {}
): Promise<T> => {
  const { method = "GET", body, auth = true } = options;
  const baseUrl = getBackendBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = await getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      (payload as { error?: string; message?: string } | null)?.error ||
      (payload as { error?: string; message?: string } | null)?.message ||
      `Request failed with status ${response.status}`;

    throw new BackendApiError(message, response.status, payload);
  }

  return payload as T;
};
