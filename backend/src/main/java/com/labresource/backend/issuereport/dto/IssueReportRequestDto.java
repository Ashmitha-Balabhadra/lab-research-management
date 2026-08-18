package com.labresource.backend.issuereport.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class IssueReportRequestDto {
    @NotNull
    private Long bookingId;

    @NotBlank
    private String issueType;

    @NotBlank
    private String description;

    private String priority = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL
    private String attachmentUrl;
}
