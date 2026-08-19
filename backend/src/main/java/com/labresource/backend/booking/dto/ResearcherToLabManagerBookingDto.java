package com.labresource.backend.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResearcherToLabManagerBookingDto {
    private Long bookingId;
    private Long equipmentId;
    private String equipmentName;
    private String equipmentModel;
    private String equipmentLocation;
    private Long researcherId;
    private String researcherName;
    private String researcherEmail;
    private Long departmentId;
    private String departmentName;
    private Long institutionId;
    private String institutionName;
    private List<LabManagerSummaryDto> eligibleLabManagers;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private String purpose;
    private Boolean isRecurring;
    private String recurrencePattern;
    private Long approvedBy;
    private String approvedByName;
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LabManagerSummaryDto {
        private Long userId;
        private String name;
        private String email;
    }
}
