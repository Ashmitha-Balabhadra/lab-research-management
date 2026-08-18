package com.labresource.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {
    @NotBlank
    private String firstName;

    private String lastName;
    private String phoneNumber;
    private String profilePictureUrl;
}
