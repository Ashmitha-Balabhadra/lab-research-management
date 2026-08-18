package com.labresource.backend.booking.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class RescheduleRequestDto {
    @NotNull
    private LocalDateTime startTime;

    @NotNull
    private LocalDateTime endTime;
}
