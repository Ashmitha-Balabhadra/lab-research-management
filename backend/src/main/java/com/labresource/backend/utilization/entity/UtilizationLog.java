package com.labresource.backend.utilization.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "UtilizationLog")
@Getter
@Setter
@NoArgsConstructor
public class UtilizationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "utilization_id")
    private Long utilizationId;

    @Column(name = "equipment_id", nullable = false)
    private Long equipmentId;

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "usage_start_time", nullable = false)
    private LocalDateTime usageStartTime;

    @Column(name = "usage_end_time")
    private LocalDateTime usageEndTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "recorded_by")
    private Long recordedBy;

    @Column(name = "source", nullable = false, length = 20)
    private String source = "MANUAL"; // IOT_SENSOR, MANUAL

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
