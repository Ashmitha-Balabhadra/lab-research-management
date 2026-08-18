// Central HTTP client for talking to the Spring Boot backend.
// Reads/writes the JWT to localStorage under LABFLOW_TOKEN_KEY so a page
// refresh doesn't sign the user out.

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api";

const TOKEN_KEY = "labflow_token";
const USER_KEY = "labflow_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * apiFetch("/bookings", { method: "POST", body: {...} })
 */
export async function apiFetch(path, { method = "GET", body, params } = {}) {
  let url = `${API_BASE_URL}${path}`;

  if (params) {
    const query = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    if (query) url += `?${query}`;
  }

  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new ApiError(
      "Could not reach the LabFlow Pro server. Is the backend running on " + API_BASE_URL + "?",
      0
    );
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    if (response.status === 401) clearSession();
    throw new ApiError(message, response.status);
  }

  return payload;
}

export { ApiError };
