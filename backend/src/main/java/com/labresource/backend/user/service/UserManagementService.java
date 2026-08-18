package com.labresource.backend.user.service;

import com.labresource.backend.auth.entity.AppUser;
import com.labresource.backend.auth.repository.AppUserRepository;
import com.labresource.backend.common.exception.ApiException;
import com.labresource.backend.notification.service.NotificationService;
import com.labresource.backend.role.entity.Role;
import com.labresource.backend.role.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final AppUserRepository appUserRepository;
    private final RoleRepository roleRepository;
    private final NotificationService notificationService;

    @Transactional
    public void verifyInstitutionAdmin(Long userId) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found."));

        boolean isInstAdmin = user.getRoles().stream()
                .anyMatch(r -> Role.INSTITUTION_ADMIN.equals(r.getRoleName()));

        if (!isInstAdmin) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The target user is not registered as an Institution Administrator.");
        }

        user.setIsActive(true);
        user.setIsEmailVerified(true);
        appUserRepository.save(user);

        log.info("Institution Admin with email {} verified by System Admin.", user.getEmail());

        notificationService.notifyUser(
                user.getUserId(),
                "ACCOUNT_VERIFIED",
                "Account Verified",
                "Your Institution Administrator account has been successfully verified and activated. You can now log in."
        );
    }

    @Transactional
    public void approveStudent(Long instAdminUserId, Long studentUserId) {
        AppUser admin = appUserRepository.findById(instAdminUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Institution Admin not found."));

        AppUser student = appUserRepository.findById(studentUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Student/Researcher not found."));

        if (!admin.getInstitutionId().equals(student.getInstitutionId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only approve students within your own institution.");
        }

        boolean isStudent = student.getRoles().stream()
                .anyMatch(r -> Role.RESEARCHER.equals(r.getRoleName()));

        if (!isStudent) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The target user is not a Student/Researcher.");
        }

        student.setIsActive(true);
        appUserRepository.save(student);

        log.info("Student with email {} approved by Institution Admin ID {}.", student.getEmail(), instAdminUserId);

        notificationService.notifyUser(
                student.getUserId(),
                "ACCOUNT_APPROVED",
                "Account Approved",
                "Your Student/Researcher account has been approved by your Institution Administrator. You can now log in."
        );
    }

    @Transactional
    public void assignDepartmentRole(Long managerUserId, Long targetUserId, Long departmentId, String roleName) {
        AppUser manager = appUserRepository.findById(managerUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Manager not found."));

        AppUser target = appUserRepository.findById(targetUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Target user not found."));

        // Validate that target belongs to the same institution
        if (!manager.getInstitutionId().equals(target.getInstitutionId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only assign roles to users in your own institution.");
        }

        // Validate target role input matches business roles
        if (!Role.DEPARTMENT_HEAD.equalsIgnoreCase(roleName) &&
                !Role.LAB_MANAGER.equalsIgnoreCase(roleName) &&
                !Role.LAB_TECHNICIAN.equalsIgnoreCase(roleName)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only DEPARTMENT_HEAD, LAB_MANAGER, or LAB_TECHNICIAN can be assigned to departments.");
        }

        Role role = roleRepository.findByRoleName(roleName.toUpperCase())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Role " + roleName + " not found."));

        target.setDepartmentId(departmentId);
        target.setRoles(new HashSet<>() {{ add(role); }});
        target.setIsActive(true); // Automatically activate on assignment
        appUserRepository.save(target);

        log.info("User {} assigned to Department ID {} with Role {}.", target.getEmail(), departmentId, roleName);

        // Notify the assigned user
        notificationService.notifyUser(
                target.getUserId(),
                "ROLE_ASSIGNED",
                "Role Assigned: " + roleName,
                "You have been assigned as a " + roleName + " in department ID: " + departmentId
        );
    }
}
