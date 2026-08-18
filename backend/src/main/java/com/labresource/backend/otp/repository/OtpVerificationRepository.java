package com.labresource.backend.otp.repository;

import com.labresource.backend.otp.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    java.util.List<OtpVerification> findByIdentifierAndPurposeAndIsUsedFalse(String identifier, String purpose);
    Optional<OtpVerification> findFirstByIdentifierAndPurposeAndIsUsedFalseOrderByCreatedAtDesc(String identifier, String purpose);
    Optional<OtpVerification> findFirstByIdentifierAndPurposeAndVerifiedAtNotNullOrderByVerifiedAtDesc(String identifier, String purpose);
}
