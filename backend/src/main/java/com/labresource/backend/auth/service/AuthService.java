package com.labresource.backend.auth.service;

import com.labresource.backend.auth.dto.AuthResponse;
import com.labresource.backend.auth.dto.LoginRequest;
import com.labresource.backend.auth.dto.RegisterRequest;
import com.labresource.backend.auth.dto.UserSummaryDto;
import com.labresource.backend.auth.entity.AppUser;
import com.labresource.backend.role.entity.Role;
import com.labresource.backend.common.exception.ApiException;
import com.labresource.backend.auth.repository.AppUserRepository;
import com.labresource.backend.department.repository.DepartmentRepository;
import com.labresource.backend.institution.repository.InstitutionRepository;
import com.labresource.backend.role.repository.RoleRepository;
import com.labresource.backend.security.JwtTokenProvider;
import com.labresource.backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final InstitutionRepository institutionRepository;
    private final DepartmentRepository departmentRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final com.labresource.backend.otp.repository.OtpVerificationRepository otpVerificationRepository;
    private final com.labresource.backend.session.service.SessionService sessionService;
    private final com.labresource.backend.notification.service.NotificationService notificationService;

    @Transactional
    public UserSummaryDto register(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Passwords do not match.");
        }
        if (appUserRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with this email already exists.");
        }
        if (!institutionRepository.existsById(request.getInstitutionId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selected institution does not exist.");
        }
        if (!departmentRepository.existsById(request.getDepartmentId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selected department does not exist.");
        }

        // Verify OTP was successfully completed within the last 15 minutes
        otpVerificationRepository.findFirstByIdentifierAndPurposeAndVerifiedAtNotNullOrderByVerifiedAtDesc(
                request.getEmail().toLowerCase(), "REGISTRATION")
                .filter(otp -> otp.getVerifiedAt().isAfter(java.time.LocalDateTime.now().minusMinutes(15)))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Email OTP verification is required prior to registration."));

        String requestedRoleName = request.getRole() != null ? request.getRole().toUpperCase() : Role.RESEARCHER;
        if (!Role.RESEARCHER.equals(requestedRoleName) && !Role.INSTITUTION_ADMIN.equals(requestedRoleName)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid registration role. Only RESEARCHER and INSTITUTION_ADMIN are allowed to self-register.");
        }

        Role assignedRole = roleRepository.findByRoleName(requestedRoleName)
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, requestedRoleName + " role is not configured."));

        AppUser user = new AppUser();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setAuthProvider("LOCAL");
        user.setPhoneNumber(request.getPhone());
        user.setInstitutionId(request.getInstitutionId());
        user.setDepartmentId(request.getDepartmentId());
        
        // Account must be verified/approved before logging in
        user.setIsActive(false); 
        user.setIsEmailVerified(false);
        user.setRoles(new HashSet<>() {{ add(assignedRole); }});

        AppUser saved = appUserRepository.save(user);

        // Notify admins for verification/approval
        if (Role.INSTITUTION_ADMIN.equals(requestedRoleName)) {
            notificationService.notifySystemAdmins(
                    "INSTITUTION_ADMIN_REGISTRATION",
                    "New Institution Admin Registration",
                    "An institution admin registered for email: " + saved.getEmail() + ". Verification is required."
            );
        } else {
            notificationService.notifyInstitutionAdmins(
                    saved.getInstitutionId(),
                    "STUDENT_REGISTRATION",
                    "New Student/Researcher Registration",
                    "A student/researcher registered for email: " + saved.getEmail() + ". Approval is required."
            );
        }

        return UserSummaryDto.fromEntity(saved);
    }

    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {
        AppUser user = appUserRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
        }
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This account has been deactivated. Contact your Institution Admin.");
        }

        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtTokenProvider.generateToken(principal);

        // Record session and generate refresh token
        sessionService.createSession(user.getUserId(), ipAddress, userAgent);
        String refreshToken = sessionService.createRefreshToken(user.getUserId());

        AuthResponse response = new AuthResponse(token, UserSummaryDto.fromEntity(user));
        response.setRefreshToken(refreshToken);
        return response;
    }

    @Transactional
    public void logout(Long userId) {
        sessionService.logout(userId);
    }

    public UserSummaryDto currentUser(Long userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));
        return UserSummaryDto.fromEntity(user);
    }
}
