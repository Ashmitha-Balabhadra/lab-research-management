package com.labresource.backend.notification.service;

import com.labresource.backend.notification.dto.NotificationDto;
import com.labresource.backend.auth.entity.AppUser;
import com.labresource.backend.notification.entity.Notification;
import com.labresource.backend.role.entity.Role;
import com.labresource.backend.common.exception.ApiException;
import com.labresource.backend.auth.repository.AppUserRepository;
import com.labresource.backend.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final AppUserRepository appUserRepository;

    public void notifyUser(Long userId, String type, String title, String message) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(type);
        n.setChannel("PUSH");
        n.setTitle(title);
        n.setMessage(message);
        n.setIsRead(false);
        notificationRepository.save(n);
    }

    /** Notify every Lab Manager attached to the given department (e.g. when a booking/issue is created). */
    public void notifyDepartmentLabManagers(Long departmentId, String type, String title, String message) {
        List<AppUser> managers = appUserRepository.findByRoleNameAndDepartmentId(Role.LAB_MANAGER, departmentId);
        for (AppUser manager : managers) {
            notifyUser(manager.getUserId(), type, title, message);
        }
    }

    public List<NotificationDto> myNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationDto::fromEntity)
                .toList();
    }

    public NotificationDto markRead(Long userId, Long notificationId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found."));
        if (!n.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This notification does not belong to you.");
        }
        n.setIsRead(true);
        return NotificationDto.fromEntity(notificationRepository.save(n));
    }

    public long unreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public void notifySystemAdmins(String type, String title, String message) {
        List<AppUser> systemAdmins = appUserRepository.findByRoleName(Role.SYSTEM_ADMIN);
        for (AppUser admin : systemAdmins) {
            notifyUser(admin.getUserId(), type, title, message);
        }
    }

    public void notifyInstitutionAdmins(Long institutionId, String type, String title, String message) {
        List<AppUser> instAdmins = appUserRepository.findByRoleNameAndInstitutionId(Role.INSTITUTION_ADMIN, institutionId);
        for (AppUser admin : instAdmins) {
            notifyUser(admin.getUserId(), type, title, message);
        }
    }
}
