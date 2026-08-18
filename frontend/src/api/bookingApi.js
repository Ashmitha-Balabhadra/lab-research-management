import { apiFetch } from "./client";

export const bookingApi = {
  create: (payload) => apiFetch("/bookings", { method: "POST", body: payload }),
  myBookings: (tab) => apiFetch("/bookings/my", { params: { tab } }),
  cancel: (bookingId) => apiFetch(`/bookings/${bookingId}/cancel`, { method: "PUT" }),
  reschedule: (bookingId, payload) =>
    apiFetch(`/bookings/${bookingId}/reschedule`, { method: "PUT", body: payload }),
};
