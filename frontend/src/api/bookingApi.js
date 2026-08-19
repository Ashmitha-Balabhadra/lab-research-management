import { apiFetch } from "./client";

export const bookingApi = {
  create: (payload) => apiFetch("/bookings", { method: "POST", body: payload }),
  myBookings: (tab) => apiFetch("/bookings/my", { params: { tab } }),
  getApprovals: (status) => apiFetch("/bookings/approvals", { params: status ? { status } : {} }),
  getResearcherToLabManagerTest: () => apiFetch("/bookings/test/researcher-to-lab-manager"),
  approve: (bookingId) => apiFetch(`/bookings/${bookingId}/approve`, { method: "POST" }),
  reject: (bookingId, reason) =>
    apiFetch(`/bookings/${bookingId}/reject`, { method: "POST", params: reason ? { reason } : {} }),
  cancel: (bookingId) => apiFetch(`/bookings/${bookingId}/cancel`, { method: "PUT" }),
  reschedule: (bookingId, payload) =>
    apiFetch(`/bookings/${bookingId}/reschedule`, { method: "PUT", body: payload }),
};
