package com.labresource.backend.scheduler;

import com.labresource.backend.equipment.entity.Equipment;
import com.labresource.backend.equipment.entity.EquipmentOperatingSchedule;
import com.labresource.backend.equipment.repository.EquipmentOperatingScheduleRepository;
import com.labresource.backend.equipment.repository.EquipmentRepository;
import com.labresource.backend.utilization.entity.UtilizationLog;
import com.labresource.backend.utilization.entity.UtilizationMetric;
import com.labresource.backend.utilization.repository.UtilizationLogRepository;
import com.labresource.backend.utilization.repository.UtilizationMetricRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class UtilizationAggregationJob {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentOperatingScheduleRepository scheduleRepository;
    private final UtilizationLogRepository utilizationLogRepository;
    private final UtilizationMetricRepository utilizationMetricRepository;

    @Scheduled(cron = "0 30 0 * * *") // Runs daily at 12:30 AM
    @Transactional
    public void aggregateUtilization() {
        log.info("Running UtilizationAggregationJob...");
        LocalDate yesterday = LocalDate.now().minusDays(1);
        int yesterdayDayOfWeek = yesterday.getDayOfWeek().getValue(); // 1 = Monday, 7 = Sunday

        List<Equipment> equipmentList = equipmentRepository.findAll();

        for (Equipment eq : equipmentList) {
            // Find operating hours for yesterday
            double availableHours = scheduleRepository.findByEquipmentIdAndDayOfWeek(eq.getEquipmentId(), yesterdayDayOfWeek)
                    .map(sched -> {
                        if (Boolean.FALSE.equals(sched.getIsAvailable())) return 0.0;
                        return (double) Duration.between(sched.getOpenTime(), sched.getCloseTime()).toMinutes() / 60.0;
                    })
                    .orElse(8.0); // Default to 8 available hours if no schedule found

            if (availableHours <= 0.0) {
                availableHours = 8.0; // fallback default
            }

            // Find utilization logs for yesterday
            double usedHours = utilizationLogRepository.findByEquipmentId(eq.getEquipmentId()).stream()
                    .filter(log -> log.getUsageStartTime().toLocalDate().equals(yesterday))
                    .mapToDouble(log -> log.getDurationMinutes() != null ? (double) log.getDurationMinutes() / 60.0 : 0.0)
                    .sum();

            double idleHours = Math.max(0.0, availableHours - usedHours);
            double downtimeHours = "UNDER_MAINTENANCE".equals(eq.getStatus()) ? 24.0 : 0.0;

            double utilizationRate = (usedHours / availableHours) * 100.0;
            double idleRate = (idleHours / availableHours) * 100.0;

            // Check if metric already exists to update it, else create
            UtilizationMetric metric = utilizationMetricRepository.findByEquipmentIdAndPeriodTypeAndPeriodDate(
                    eq.getEquipmentId(), "DAILY", yesterday)
                    .orElse(new UtilizationMetric());

            metric.setEquipmentId(eq.getEquipmentId());
            metric.setDepartmentId(eq.getDepartmentId());
            metric.setInstitutionId(eq.getInstitutionId());
            metric.setPeriodType("DAILY");
            metric.setPeriodDate(yesterday);
            metric.setTotalAvailableHours(BigDecimal.valueOf(availableHours).setScale(2, RoundingMode.HALF_UP));
            metric.setTotalUsedHours(BigDecimal.valueOf(usedHours).setScale(2, RoundingMode.HALF_UP));
            metric.setIdleTimeHours(BigDecimal.valueOf(idleHours).setScale(2, RoundingMode.HALF_UP));
            metric.setDowntimeHours(BigDecimal.valueOf(downtimeHours).setScale(2, RoundingMode.HALF_UP));
            metric.setUtilizationRate(BigDecimal.valueOf(utilizationRate).setScale(2, RoundingMode.HALF_UP));
            metric.setIdleRate(BigDecimal.valueOf(idleRate).setScale(2, RoundingMode.HALF_UP));

            utilizationMetricRepository.save(metric);
            log.info("Aggregated metrics for Equipment ID: {}, Rate: {}%", eq.getEquipmentId(), metric.getUtilizationRate());
        }
    }
}
