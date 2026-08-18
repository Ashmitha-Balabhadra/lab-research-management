package com.labresource.backend.issuereport.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "EquipmentIssueReport")
@Getter
@Setter
@NoArgsConstructor
public class EquipmentIssueReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "issue_report_id")
    private Long issueReportId;

    @Column(name = "equipment_id", nullable = false)
    private Long equipmentId;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "reported_by", nullable = false)
    private Long reportedBy;

    @Column(name = "issue_type", length = 100)
    private String issueType;

    @Column(name = "issue_description", nullable = false, columnDefinition = "text")
    private String issueDescription;

    @Column(name = "priority", nullable = false, length = 20)
    private String priority = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL

    @Column(name = "attachment_public_id", length = 500)
    private String attachmentPublicId;

    @Column(name = "attachment_secure_url", length = 1000)
    private String attachmentSecureUrl;

    @Column(name = "attachment_file_name", length = 255)
    private String attachmentFileName;

    @Column(name = "attachment_content_type", length = 100)
    private String attachmentContentType;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "OPEN"; // OPEN, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED, CANCELLED

    @Column(name = "assigned_technician_id")
    private Long assignedTechnicianId;

    @Column(name = "resolved_by")
    private Long resolvedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "resolution_notes", columnDefinition = "text")
    private String resolutionNotes;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
