package com.labresource.backend.user.controller;

import com.labresource.backend.security.UserPrincipal;
import com.labresource.backend.user.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserManagementController {

    private final UserManagementService userManagementService;

    @PostMapping("/verify-institution-admin/{userId}")
    @PreAuthorize("hasAnyAuthority('SYSTEM_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public Map<String, String> verifyInstitutionAdmin(@PathVariable Long userId) {
        userManagementService.verifyInstitutionAdmin(userId);
        return Map.of("message", "Institution Administrator verified and activated successfully.");
    }

    @PostMapping("/approve-student/{userId}")
    @PreAuthorize("hasAnyAuthority('INSTITUTION_ADMIN', 'ROLE_INSTITUTION_ADMIN')")
    public Map<String, String> approveStudent(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long userId) {
        userManagementService.approveStudent(principal.getUserId(), userId);
        return Map.of("message", "Student/Researcher approved and activated successfully.");
    }

    @PostMapping("/assign-department-role")
    @PreAuthorize("hasAnyAuthority('INSTITUTION_ADMIN', 'ROLE_INSTITUTION_ADMIN')")
    public Map<String, String> assignDepartmentRole(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam Long userId,
            @RequestParam Long departmentId,
            @RequestParam String role) {
        userManagementService.assignDepartmentRole(principal.getUserId(), userId, departmentId, role);
        return Map.of("message", "Role " + role + " successfully assigned to the user within the department.");
    }
}
