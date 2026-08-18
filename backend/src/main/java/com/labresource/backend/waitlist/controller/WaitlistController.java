package com.labresource.backend.waitlist.controller;

import com.labresource.backend.waitlist.dto.WaitlistDto;
import com.labresource.backend.waitlist.dto.WaitlistRequestDto;
import com.labresource.backend.security.UserPrincipal;
import com.labresource.backend.waitlist.service.WaitlistService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/waitlists")
@RequiredArgsConstructor
public class WaitlistController {

    private final WaitlistService waitlistService;

    @PostMapping
    @PreAuthorize("hasAuthority('JOIN_WAITLIST')")
    public WaitlistDto join(@AuthenticationPrincipal UserPrincipal principal,
                             @Valid @RequestBody WaitlistRequestDto request) {
        return waitlistService.join(principal.getUserId(), request);
    }

    @GetMapping("/my")
    public List<WaitlistDto> my(@AuthenticationPrincipal UserPrincipal principal) {
        return waitlistService.myWaitlist(principal.getUserId());
    }

    @PostMapping("/{waitlistId}/confirm")
    @PreAuthorize("hasAuthority('JOIN_WAITLIST')")
    public Map<String, Object> confirm(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long waitlistId) {
        com.labresource.backend.booking.entity.Booking booking = waitlistService.confirm(principal.getUserId(), waitlistId);
        return Map.of(
                "message", "Slot confirmed successfully.",
                "bookingId", booking.getBookingId()
        );
    }
}
