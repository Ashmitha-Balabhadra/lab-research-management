package com.labresource.backend.user.service;

import com.labresource.backend.auth.dto.UserSummaryDto;
import com.labresource.backend.auth.entity.AppUser;
import com.labresource.backend.auth.repository.AppUserRepository;
import com.labresource.backend.booking.entity.Booking;
import com.labresource.backend.booking.repository.BookingRepository;
import com.labresource.backend.common.exception.ApiException;
import com.labresource.backend.department.entity.Department;
import com.labresource.backend.department.repository.DepartmentRepository;
import com.labresource.backend.institution.entity.Institution;
import com.labresource.backend.institution.repository.InstitutionRepository;
import com.labresource.backend.user.dto.ProfileDto;
import com.labresource.backend.user.dto.UpdateProfileRequest;
import com.labresource.backend.auth.dto.ChangePasswordRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final AppUserRepository appUserRepository;
    private final InstitutionRepository institutionRepository;
    private final DepartmentRepository departmentRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileDto getProfile(Long userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));

        String institutionName = user.getInstitutionId() != null
                ? institutionRepository.findById(user.getInstitutionId()).map(Institution::getName).orElse(null)
                : null;
        String departmentName = user.getDepartmentId() != null
                ? departmentRepository.findById(user.getDepartmentId()).map(Department::getName).orElse(null)
                : null;

        long total = bookingRepository.countByUserId(userId);
        long completed = bookingRepository.countByUserIdAndStatus(userId, Booking.COMPLETED);
        long cancelled = bookingRepository.countByUserIdAndStatus(userId, Booking.CANCELLED);
        long noShow = bookingRepository.countByUserIdAndStatus(userId, Booking.NO_SHOW);

        return new ProfileDto(UserSummaryDto.fromEntity(user), institutionName, departmentName, total, completed, cancelled, noShow);
    }

    @Transactional
    public UserSummaryDto updateProfile(Long userId, UpdateProfileRequest request) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        if (request.getProfilePictureUrl() != null) {
            user.setProfilePictureSecureUrl(request.getProfilePictureUrl());
        }

        return UserSummaryDto.fromEntity(appUserRepository.save(user));
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        appUserRepository.save(user);
    }
}
