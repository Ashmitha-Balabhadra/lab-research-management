package com.labresource.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterRequest {
    @NotBlank
    private String firstName;

    private String lastName;

    @NotBlank
    @Email
    private String email;

    private String phone;

    @NotNull
    private Long institutionId;

    @NotNull
    private Long departmentId;

    @NotBlank
    @Size(min = 8, message = "Password must be at least 8 characters.")
    private String password;

    @NotBlank
    private String confirmPassword;

    private String role = "RESEARCHER"; // RESEARCHER or INSTITUTION_ADMIN
}
