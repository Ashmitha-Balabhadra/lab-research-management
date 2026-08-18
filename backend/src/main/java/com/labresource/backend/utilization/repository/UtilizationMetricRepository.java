package com.labresource.backend.utilization.repository;

import com.labresource.backend.utilization.entity.UtilizationMetric;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UtilizationMetricRepository extends JpaRepository<UtilizationMetric, Long> {
    List<UtilizationMetric> findByEquipmentIdAndPeriodTypeOrderByPeriodDateAsc(Long equipmentId, String periodType);
    List<UtilizationMetric> findByDepartmentIdAndPeriodTypeOrderByPeriodDateAsc(Long departmentId, String periodType);
    Optional<UtilizationMetric> findByEquipmentIdAndPeriodTypeAndPeriodDate(Long equipmentId, String periodType, LocalDate periodDate);
}
