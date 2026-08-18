package com.labresource.backend.invitation.controller;

import com.labresource.backend.invitation.dto.InvitationRequestDto;
import com.labresource.backend.invitation.entity.UserInvitation;
import com.labresource.backend.security.UserPrincipal;
import com.labresource.backend.invitation.service.UserInvitationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
public class UserInvitationController {

    private final UserInvitationService userInvitationService;

    @PostMapping("/send")
    @PreAuthorize("hasAuthority('CREATE_USER')")
    public Map<String, String> inviteUser(@AuthenticationPrincipal UserPrincipal principal,
                                          @Valid @RequestBody InvitationRequestDto request) {
        userInvitationService.inviteUser(principal.getUserId(), request);
        return Map.of("message", "Invitation sent successfully.");
    }

    @GetMapping("/verify")
    public Map<String, Object> verifyInvitation(@RequestParam String token) {
        UserInvitation invite = userInvitationService.verifyAndGetInvitation(token);
        return Map.of(
                "email", invite.getEmail(),
                "institutionId", invite.getInstitutionId(),
                "departmentId", invite.getDepartmentId() != null ? invite.getDepartmentId() : "",
                "roleId", invite.getRoleId()
        );
    }
}
