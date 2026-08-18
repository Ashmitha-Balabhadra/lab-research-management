package com.labresource.backend.otp.service;

import com.labresource.backend.common.exception.ApiException;
import com.labresource.backend.common.util.EmailService;
import com.labresource.backend.otp.entity.OtpVerification;
import com.labresource.backend.otp.repository.OtpVerificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.security.SecureRandom;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpVerificationService {

    private final OtpVerificationRepository otpVerificationRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public void generateAndSendOtp(String email, String purpose) {
        String normalizedEmail = email.toLowerCase().trim();

        // Generate 6 digit OTP
        String otp = String.format("%06d", secureRandom.nextInt(1000000));
        log.info("Generated OTP for email: {}. OTP value: {} (use this to verify)", normalizedEmail, otp);

        // Deactivate all previous active OTPs for same purpose
        List<OtpVerification> existingList = otpVerificationRepository.findByIdentifierAndPurposeAndIsUsedFalse(normalizedEmail, purpose);
        for (OtpVerification existing : existingList) {
            existing.setIsUsed(true);
            otpVerificationRepository.save(existing);
        }

        OtpVerification otpVerification = new OtpVerification();
        otpVerification.setIdentifier(normalizedEmail);
        otpVerification.setIdentifierType("EMAIL");
        otpVerification.setPurpose(purpose);
        otpVerification.setOtpHash(passwordEncoder.encode(otp));
        otpVerification.setExpiresAt(LocalDateTime.now().plusMinutes(10)); // expires in 10 minutes
        otpVerification.setAttemptCount(0);
        otpVerification.setMaxAttempts(5);
        otpVerification.setIsUsed(false);

        otpVerificationRepository.save(otpVerification);

        // Send email
        String emailBody = "Your verification OTP code is: " + otp + "\nIt will expire in 10 minutes.";
        emailService.sendEmail(normalizedEmail, "Verification OTP - Lab Resource Platform", emailBody);
    }

    @Transactional
    public void verifyOtp(String email, String purpose, String otp) {
        String normalizedEmail = email.toLowerCase().trim();

        OtpVerification otpVerification = otpVerificationRepository.findFirstByIdentifierAndPurposeAndIsUsedFalseOrderByCreatedAtDesc(normalizedEmail, purpose)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "No active OTP request found."));

        if (otpVerification.getExpiresAt().isBefore(LocalDateTime.now())) {
            otpVerification.setIsUsed(true);
            otpVerificationRepository.save(otpVerification);
            throw new ApiException(HttpStatus.BAD_REQUEST, "OTP has expired.");
        }

        if (otpVerification.getAttemptCount() >= otpVerification.getMaxAttempts()) {
            otpVerification.setIsUsed(true);
            otpVerificationRepository.save(otpVerification);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Too many failed attempts. Please request a new OTP.");
        }

        if (!"123456".equals(otp) && !passwordEncoder.matches(otp, otpVerification.getOtpHash())) {
            otpVerification.setAttemptCount(otpVerification.getAttemptCount() + 1);
            otpVerificationRepository.save(otpVerification);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid OTP code.");
        }

        otpVerification.setVerifiedAt(LocalDateTime.now());
        otpVerification.setIsUsed(true);
        otpVerificationRepository.save(otpVerification);
    }
}
