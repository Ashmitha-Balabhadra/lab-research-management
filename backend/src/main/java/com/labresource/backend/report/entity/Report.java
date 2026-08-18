package com.labresource.backend.report.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "Report")
@Getter
@Setter
@NoArgsConstructor
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long reportId;

    @Column(name = "generated_by", nullable = false)
    private Long generatedBy;

    @Column(name = "report_type", nullable = false, length = 30)
    private String reportType; // UTILIZATION, MAINTENANCE, SHARING, PROCUREMENT, BUDGET

    @Column(name = "institution_id", nullable = false)
    private Long institutionId;

    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "cloudinary_public_id", length = 500)
    private String cloudinaryPublicId;

    @Column(name = "cloudinary_secure_url", length = 1000)
    private String cloudinarySecureUrl;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "format", nullable = false, length = 10)
    private String format; // PDF, EXCEL

    @Column(name = "generated_at", insertable = false, updatable = false)
    private LocalDateTime generatedAt;
}
