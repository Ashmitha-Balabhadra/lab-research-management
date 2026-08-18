package com.labresource.backend.auth.controller;

import com.labresource.backend.auth.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/password-reset")
@RequiredArgsConstructor
public class PasswordResetController {

    private final PasswordResetService passwordResetService;

    @PostMapping("/request")
    public Map<String, String> requestReset(@RequestParam String email) {
        passwordResetService.requestPasswordReset(email);
        return Map.of("message", "Password reset link has been sent to your email.");
    }

    @PostMapping("/reset")
    public Map<String, String> resetPassword(@RequestParam String token, @RequestParam String newPassword) {
        passwordResetService.resetPassword(token, newPassword);
        return Map.of("message", "Password reset successful.");
    }
}
