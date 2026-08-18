import { apiFetch } from "./client";

export const profileApi = {
  get: () => apiFetch("/profile"),
  update: (payload) => apiFetch("/profile", { method: "PUT", body: payload }),
  changePassword: (payload) => apiFetch("/profile/password", { method: "PUT", body: payload }),
};
