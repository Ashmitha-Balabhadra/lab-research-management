import { apiFetch } from "./client";

export const notificationApi = {
  list: () => apiFetch("/notifications"),
  unreadCount: () => apiFetch("/notifications/unread-count"),
  markRead: (notificationId) => apiFetch(`/notifications/${notificationId}/read`, { method: "PUT" }),
};
