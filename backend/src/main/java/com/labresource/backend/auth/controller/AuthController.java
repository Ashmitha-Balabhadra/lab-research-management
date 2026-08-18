package com.labresource.backend.auth.controller;

import com.labresource.backend.auth.dto.*;
import com.labresource.backend.security.UserPrincipal;
import com.labresource.backend.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final jakarta.servlet.http.HttpServletRequest httpServletRequest;

    @PostMapping("/auth/register")
    public UserSummaryDto register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        String ipAddress = httpServletRequest.getRemoteAddr();
        String userAgent = httpServletRequest.getHeader("User-Agent");
        return authService.login(request, ipAddress, userAgent);
    }

    @PostMapping("/auth/logout")
    public Map<String, String> logout(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal != null) {
            authService.logout(principal.getUserId());
        }
        return Map.of("message", "Logged out successfully.");
    }

    @GetMapping("/auth/me")
    public UserSummaryDto me(@AuthenticationPrincipal UserPrincipal principal) {
        return authService.currentUser(principal.getUserId());
    }
}
