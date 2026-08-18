import { apiFetch } from "./client";

export const waitlistApi = {
  join: (payload) => apiFetch("/waitlists", { method: "POST", body: payload }),
  myWaitlist: () => apiFetch("/waitlists/my"),
};
