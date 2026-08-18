package com.labresource.backend.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private UserSummaryDto user;
    private String refreshToken;

    public AuthResponse(String token, UserSummaryDto user) {
        this.token = token;
        this.user = user;
    }
}
