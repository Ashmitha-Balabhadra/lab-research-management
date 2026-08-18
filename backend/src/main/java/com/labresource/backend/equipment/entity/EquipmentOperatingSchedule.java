package com.labresource.backend.equipment.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@Entity
@Table(name = "EquipmentOperatingSchedule")
@Getter
@Setter
@NoArgsConstructor
public class EquipmentOperatingSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Long scheduleId;

    @Column(name = "equipment_id", nullable = false)
    private Long equipmentId;

    @Column(name = "day_of_week", nullable = false)
    private Integer dayOfWeek; // 1 to 7

    @Column(name = "open_time", nullable = false)
    private LocalTime openTime;

    @Column(name = "close_time", nullable = false)
    private LocalTime closeTime;

    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable = true;
}
