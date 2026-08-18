import { apiFetch } from "./client";

export const authApi = {
  register: (payload) => apiFetch("/auth/register", { method: "POST", body: payload }),
  login: (payload) => apiFetch("/auth/login", { method: "POST", body: payload }),
  me: () => apiFetch("/auth/me"),
  listInstitutions: () => apiFetch("/institutions"),
  listDepartments: (institutionId) => apiFetch(`/institutions/${institutionId}/departments`),
};
