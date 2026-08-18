package com.labresource.backend.utilization.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "UtilizationMetric")
@Getter
@Setter
@NoArgsConstructor
public class UtilizationMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "metric_id")
    private Long metricId;

    @Column(name = "equipment_id", nullable = false)
    private Long equipmentId;

    @Column(name = "department_id", nullable = false)
    private Long departmentId;

    @Column(name = "institution_id", nullable = false)
    private Long institutionId;

    @Column(name = "period_type", nullable = false, length = 20)
    private String periodType; // DAILY, WEEKLY, MONTHLY

    @Column(name = "period_date", nullable = false)
    private LocalDate periodDate;

    @Column(name = "total_available_hours", nullable = false)
    private BigDecimal totalAvailableHours = BigDecimal.ZERO;

    @Column(name = "total_used_hours", nullable = false)
    private BigDecimal totalUsedHours = BigDecimal.ZERO;

    @Column(name = "idle_time_hours", nullable = false)
    private BigDecimal idleTimeHours = BigDecimal.ZERO;

    @Column(name = "downtime_hours", nullable = false)
    private BigDecimal downtimeHours = BigDecimal.ZERO;

    @Column(name = "utilization_rate", nullable = false)
    private BigDecimal utilizationRate = BigDecimal.ZERO;

    @Column(name = "idle_rate", nullable = false)
    private BigDecimal idleRate = BigDecimal.ZERO;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
