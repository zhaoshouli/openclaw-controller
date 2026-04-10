import type { ApiResponse } from "@openclaw/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  const json = (await response.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new Error(json.error.message);
  }

  return json.data;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T, TBody>(path: string, body?: TBody) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined
    }),
  put: <T, TBody>(path: string, body: TBody) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body)
    }),
  delete: <T>(path: string) =>
    request<T>(path, {
      method: "DELETE"
    }),
  baseUrl: API_BASE_URL
};

