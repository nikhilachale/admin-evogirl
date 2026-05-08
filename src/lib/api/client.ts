/**
 * API client for the promise.evogirl.com backend.
 *
 * Vite is a static SPA — it cannot safely hold marketplace API
 * credentials. All marketplace calls (Amazon/Flipkart/Meesho/Myntra)
 * must go through your own backend, which holds the secrets.
 *
 * Configure the backend URL via `VITE_API_URL` in `.env.local`.
 */

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new ApiError(res.status, body, `API ${res.status}: ${path}`);
  }

  return res.json() as Promise<T>;
}
