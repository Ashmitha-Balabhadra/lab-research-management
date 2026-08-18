package com.labresource.backend.user.controller;

import com.labresource.backend.auth.dto.ChangePasswordRequest;
import com.labresource.backend.auth.dto.UserSummaryDto;
import com.labresource.backend.security.UserPrincipal;
import com.labresource.backend.user.dto.ProfileDto;
import com.labresource.backend.user.dto.UpdateProfileRequest;
import com.labresource.backend.user.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ProfileDto getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        return profileService.getProfile(principal.getUserId());
    }

    @PutMapping
    public UserSummaryDto updateProfile(@AuthenticationPrincipal UserPrincipal principal,
                                         @Valid @RequestBody UpdateProfileRequest request) {
        return profileService.updateProfile(principal.getUserId(), request);
    }

    @PutMapping("/password")
    public void changePassword(@AuthenticationPrincipal UserPrincipal principal,
                                @Valid @RequestBody ChangePasswordRequest request) {
        profileService.changePassword(principal.getUserId(), request);
    }
}
