import { apiFetch } from "./client";

export const equipmentApi = {
  search: (params) => apiFetch("/equipment/search", { params }),
  getById: (equipmentId) => apiFetch(`/equipment/${equipmentId}`),
};
