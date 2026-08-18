package com.labresource.backend.issuereport.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EligibleBookingDto {
    private Long bookingId;
    private Long equipmentId;
    private String equipmentName;
    private String category;
    private String location;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
