package com.labresource.backend.calibration.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "EquipmentCalibration")
@Getter
@Setter
@NoArgsConstructor
public class EquipmentCalibration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "calibration_id")
    private Long calibrationId;

    @Column(name = "equipment_id", nullable = false)
    private Long equipmentId;

    @Column(name = "calibration_date", nullable = false)
    private LocalDate calibrationDate;

    @Column(name = "next_due_date", nullable = false)
    private LocalDate nextDueDate;

    @Column(name = "certificate_public_id", length = 500)
    private String certificatePublicId;

    @Column(name = "certificate_secure_url", length = 1000)
    private String certificateSecureUrl;

    @Column(name = "certificate_file_name", length = 255)
    private String certificateFileName;

    @Column(name = "performed_by", length = 150)
    private String performedBy;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
