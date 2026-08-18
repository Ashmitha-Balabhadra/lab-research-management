package com.labresource.backend.invitation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InvitationRequestDto {
    @NotBlank
    @Email
    private String email;

    @NotNull
    private Long institutionId;

    private Long departmentId;

    @NotNull
    private Long roleId;
}
