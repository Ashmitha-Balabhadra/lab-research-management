package com.labresource.backend.user.dto;

import com.labresource.backend.auth.dto.UserSummaryDto;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ProfileDto {
    private UserSummaryDto user;
    private String institutionName;
    private String departmentName;
    private long totalBookings;
    private long completedBookings;
    private long cancelledBookings;
    private long noShowBookings;
}
