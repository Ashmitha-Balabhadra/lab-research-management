package com.labresource.backend.auth.service;

import com.labresource.backend.auth.entity.AppUser;
import com.labresource.backend.auth.entity.PasswordResetToken;
import com.labresource.backend.auth.repository.AppUserRepository;
import com.labresource.backend.auth.repository.PasswordResetTokenRepository;
import com.labresource.backend.common.exception.ApiException;
import com.labresource.backend.common.util.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final AppUserRepository appUserRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void requestPasswordReset(String email) {
        AppUser user = appUserRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User with this email does not exist."));

        String token = UUID.randomUUID().toString();
        log.info("Generated password reset token for {}: {} (use this to reset)", email, token);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUserId(user.getUserId());
        resetToken.setToken(token);
        resetToken.setExpiresAt(LocalDateTime.now().plusHours(2)); // expires in 2 hours
        resetToken.setIsUsed(false);
        tokenRepository.save(resetToken);

        String resetLink = "http://localhost:5173/reset-password?token=" + token;
        String body = "You requested a password reset. Click the link below to set a new password:\n" + resetLink;

        emailService.sendEmail(email, "Password Reset Link - Lab Resource Platform", body);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid reset token."));

        if (Boolean.TRUE.equals(resetToken.getIsUsed())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This token has already been used.");
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This token has expired.");
        }

        AppUser user = appUserRepository.findById(resetToken.getUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        appUserRepository.save(user);

        resetToken.setIsUsed(true);
        tokenRepository.save(resetToken);
    }
}
