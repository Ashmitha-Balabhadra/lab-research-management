package com.labresource.backend.sharing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "SharingAgreement")
@Getter
@Setter
@NoArgsConstructor
public class SharingAgreement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "agreement_id")
    private Long agreementId;

    @Column(name = "requesting_institution_id", nullable = false)
    private Long requestingInstitutionId;

    @Column(name = "owning_institution_id", nullable = false)
    private Long owningInstitutionId;

    @Column(name = "equipment_id", nullable = false)
    private Long equipmentId;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "REQUESTED"; // REQUESTED, APPROVED, REJECTED, ACTIVE, EXPIRED, CANCELLED

    @Column(name = "cost_sharing_terms", columnDefinition = "text")
    private String costSharingTerms;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
