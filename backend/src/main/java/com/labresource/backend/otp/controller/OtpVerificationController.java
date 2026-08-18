package com.labresource.backend.otp.controller;

import com.labresource.backend.otp.service.OtpVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/otp")
@RequiredArgsConstructor
public class OtpVerificationController {

    private final OtpVerificationService otpVerificationService;

    @PostMapping("/send")
    public Map<String, String> sendOtp(@RequestParam String email, @RequestParam String purpose) {
        otpVerificationService.generateAndSendOtp(email, purpose);
        return Map.of("message", "OTP sent successfully.");
    }

    @PostMapping("/verify")
    public Map<String, String> verifyOtp(@RequestParam String email, @RequestParam String purpose, @RequestParam String otp) {
        otpVerificationService.verifyOtp(email, purpose, otp);
        return Map.of("message", "OTP verified successfully.");
    }
}
