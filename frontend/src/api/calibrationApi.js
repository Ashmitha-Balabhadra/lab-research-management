import { apiFetch } from "./client";

/**
 * Calibration API
 * ---------------------------------------------------------------
 * Calibration data is embedded in the Equipment API response.
 * There is NO dedicated calibration endpoint in the backend.
 *
 * Real endpoints that expose calibration fields:
 *   GET /api/equipment/search → List<EquipmentDto>
 *   GET /api/equipment/{id}   → EquipmentDto
 *
 * Each EquipmentDto already includes:
 *   calibrationStatus:         "VALID" | "DUE_SOON" | "OVERDUE" | "NOT_RECORDED"
 *   nextCalibrationDue:        ISO date string  (LocalDate → String)
 *   calibrationRequired:       boolean
 *   calibrationIntervalMonths: integer | null
 *
 * NOT available (backend limitation):
 *   - GET /api/calibrations            — no dedicated list endpoint
 *   - POST /api/calibrations           — no write endpoint
 *   - GET /api/calibrations/{id}/history — no history endpoint
 *
 * All calibration record updates remain local/demo state only.
 * To schedule a calibration task, use Maintenance Oversight → Scheduling.
 */
export const calibrationApi = {
  /** Fetch all equipment with embedded calibration fields (real API) */
  getAllWithCalibration: (params = {}) =>
    apiFetch("/equipment/search", { params }),

  /** Fetch a single equipment's calibration data (real API) */
  getEquipmentById: (equipmentId) =>
    apiFetch(`/equipment/${equipmentId}`),
};
