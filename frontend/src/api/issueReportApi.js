import { apiFetch } from "./client";

/**
 * API service for Equipment Issue Reports — the backend's primary
 * maintenance/work-order management resource.
 *
 * All calls go to /api/issue-reports (EquipmentIssueReportController).
 *
 * Statuses: OPEN | ASSIGNED | IN_PROGRESS | RESOLVED | CLOSED | CANCELLED
 * Priorities: LOW | MEDIUM | HIGH | CRITICAL
 */
export const issueReportApi = {
  /**
   * Researcher: get bookings eligible for issue reporting
   * (only IN_USE or COMPLETED bookings qualify).
   * GET /api/issue-reports/eligible-bookings
   */
  eligibleBookings: () => apiFetch("/issue-reports/eligible-bookings"),

  /**
   * Researcher: submit a new issue report.
   * POST /api/issue-reports
   * Body: { bookingId, issueType, description, priority }
   */
  report: (payload) =>
    apiFetch("/issue-reports", { method: "POST", body: payload }),

  /**
   * Researcher: list all issues I reported.
   * GET /api/issue-reports/my
   */
  myReports: () => apiFetch("/issue-reports/my"),

  /**
   * Lab Manager / Admin: get all department issue reports.
   * Optionally filter by status string (e.g. "OPEN", "ASSIGNED").
   * GET /api/issue-reports?status=OPEN
   */
  getDepartmentIssues: (status) =>
    apiFetch("/issue-reports", { params: status ? { status } : {} }),

  /**
   * Lab Manager / Admin: assign a technician to an issue.
   * POST /api/issue-reports/{id}/assign?technicianId={techId}
   */
  assignTechnician: (issueId, technicianId) =>
    apiFetch(`/issue-reports/${issueId}/assign`, {
      method: "POST",
      params: { technicianId },
    }),

  /**
   * Lab Manager / Admin: mark an issue as resolved.
   * POST /api/issue-reports/{id}/resolve
   */
  resolve: (issueId) =>
    apiFetch(`/issue-reports/${issueId}/resolve`, { method: "POST" }),
};
