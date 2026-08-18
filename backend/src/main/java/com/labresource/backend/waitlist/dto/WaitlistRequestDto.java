package com.labresource.backend.waitlist.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class WaitlistRequestDto {
    @NotNull
    private Long equipmentId;

    @NotNull
    private LocalDateTime requestedStartTime;

    @NotNull
    private LocalDateTime requestedEndTime;
}
