package com.labresource.backend.notification.controller;

import com.labresource.backend.notification.dto.NotificationDto;
import com.labresource.backend.security.UserPrincipal;
import com.labresource.backend.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationDto> myNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        return notificationService.myNotifications(principal.getUserId());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        return Map.of("count", notificationService.unreadCount(principal.getUserId()));
    }

    @PutMapping("/{notificationId}/read")
    public NotificationDto markRead(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long notificationId) {
        return notificationService.markRead(principal.getUserId(), notificationId);
    }

    @PutMapping("/read-all")
    public Map<String, String> markAllRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllRead(principal.getUserId());
        return Map.of("message", "All notifications marked as read.");
    }
}
