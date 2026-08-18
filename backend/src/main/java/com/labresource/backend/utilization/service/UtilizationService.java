package com.labresource.backend.utilization.service;

import com.labresource.backend.common.exception.ApiException;
import com.labresource.backend.equipment.entity.Equipment;
import com.labresource.backend.equipment.repository.EquipmentRepository;
import com.labresource.backend.utilization.entity.UtilizationLog;
import com.labresource.backend.utilization.entity.UtilizationMetric;
import com.labresource.backend.utilization.repository.UtilizationLogRepository;
import com.labresource.backend.utilization.repository.UtilizationMetricRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UtilizationService {

    private final UtilizationLogRepository utilizationLogRepository;
    private final UtilizationMetricRepository utilizationMetricRepository;
    private final EquipmentRepository equipmentRepository;

    public List<UtilizationMetric> getEquipmentHistory(Long equipmentId, String period, LocalDate from, LocalDate to) {
        return utilizationMetricRepository.findByEquipmentIdAndPeriodTypeOrderByPeriodDateAsc(equipmentId, period.toUpperCase())
                .stream()
                .filter(m -> (from == null || !m.getPeriodDate().isBefore(from)) && (to == null || !m.getPeriodDate().isAfter(to)))
                .toList();
    }

    public List<UtilizationMetric> getDepartmentHistory(Long departmentId, String period) {
        return utilizationMetricRepository.findByDepartmentIdAndPeriodTypeOrderByPeriodDateAsc(departmentId, period.toUpperCase());
    }

    public List<Map<String, Object>> getHeatmap(String scope, Long id, String period) {
        // Aggregate utilization percentage by hour of day (0-23) or day of week (1-7)
        // Group by day/hour and compute mock/real active density.
        List<Map<String, Object>> heatmapList = new ArrayList<>();
        List<Equipment> equipmentList;

        if ("DEPARTMENT".equalsIgnoreCase(scope) && id != null) {
            equipmentList = equipmentRepository.findAll().stream()
                    .filter(e -> id.equals(e.getDepartmentId()))
                    .toList();
        } else {
            equipmentList = equipmentRepository.findAll();
        }

        // Return a grid of [dayOfWeek 1..7, hourOfDay 0..23, utilizationPct] for each equipment
        for (Equipment eq : equipmentList) {
            for (int day = 1; day <= 7; day++) {
                // Generate a typical bell-curve utilization centered around working hours (9 AM - 5 PM)
                for (int hour = 8; hour <= 18; hour += 2) {
                    Map<String, Object> point = new HashMap<>();
                    point.put("equipmentId", eq.getEquipmentId());
                    point.put("equipmentName", eq.getName());
                    point.put("dayOfWeek", day);
                    point.put("hourOfDay", hour);

                    // Mock bell curve: peaks on mid-week, mid-day
                    double base = 30.0;
                    double dayFactor = (4.0 - Math.abs(4.0 - day)) * 10.0; // peak on Wed/Thu
                    double hourFactor = (5.0 - Math.abs(13.0 - hour)) * 8.0; // peak around 1 PM
                    double pct = Math.min(100.0, Math.max(0.0, base + dayFactor + hourFactor));

                    point.put("utilizationPct", BigDecimal.valueOf(pct).setScale(1, RoundingMode.HALF_UP));
                    heatmapList.add(point);
                }
            }
        }

        return heatmapList;
    }

    @Transactional
    public void recordUsageStart(Long bookingId, Long equipmentId, Long userId) {
        if (utilizationLogRepository.findByBookingId(bookingId).isEmpty()) {
            UtilizationLog logEntry = new UtilizationLog();
            logEntry.setEquipmentId(equipmentId);
            logEntry.setBookingId(bookingId);
            logEntry.setUsageStartTime(java.time.LocalDateTime.now());
            logEntry.setRecordedBy(userId);
            logEntry.setSource("MANUAL");
            utilizationLogRepository.save(logEntry);
        }
    }

    @Transactional
    public void recordUsageEnd(Long bookingId) {
        utilizationLogRepository.findByBookingId(bookingId).ifPresent(logEntry -> {
            logEntry.setUsageEndTime(java.time.LocalDateTime.now());
            long minutes = java.time.Duration.between(logEntry.getUsageStartTime(), logEntry.getUsageEndTime()).toMinutes();
            logEntry.setDurationMinutes((int) minutes);
            utilizationLogRepository.save(logEntry);
        });
    }
}
