import { apiFetch } from "./client";

export const maintenanceApi = {
  report: (payload) => apiFetch("/maintenance/report", { method: "POST", body: payload }),
  myReports: () => apiFetch("/maintenance/my"),
};
