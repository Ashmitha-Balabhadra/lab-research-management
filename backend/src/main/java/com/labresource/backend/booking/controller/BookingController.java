package com.labresource.backend.booking.controller;

import com.labresource.backend.booking.dto.BookingDto;
import com.labresource.backend.booking.dto.BookingRequestDto;
import com.labresource.backend.booking.dto.ResearcherToLabManagerBookingDto;
import com.labresource.backend.booking.dto.RescheduleRequestDto;
import com.labresource.backend.security.UserPrincipal;
import com.labresource.backend.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('BOOK_EQUIPMENT', 'ROLE_RESEARCHER', 'ROLE_LAB_MANAGER', 'ROLE_SYSTEM_ADMIN')")
    public BookingDto create(@AuthenticationPrincipal UserPrincipal principal,
                              @Valid @RequestBody BookingRequestDto request) {
        return bookingService.createBooking(principal.getUserId(), principal.getInstitutionId(), request);
    }

    @GetMapping("/my")
    public List<BookingDto> myBookings(@AuthenticationPrincipal UserPrincipal principal,
                                        @RequestParam(defaultValue = "upcoming") String tab) {
        return bookingService.myBookings(principal.getUserId(), tab);
    }

    @GetMapping("/approvals")
    @PreAuthorize("hasAnyAuthority('APPROVE_BOOKING', 'LAB_MANAGER', 'ROLE_LAB_MANAGER', 'DEPARTMENT_HEAD', 'ROLE_DEPARTMENT_HEAD', 'SYSTEM_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public List<ResearcherToLabManagerBookingDto> getApprovals(@AuthenticationPrincipal UserPrincipal principal,
                                                              @RequestParam(required = false) String status) {
        boolean isSystemAdmin = principal.getRoleNames().contains("SYSTEM_ADMIN") || principal.getRoleNames().contains("ROLE_SYSTEM_ADMIN")
                || principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SYSTEM_ADMIN") || a.getAuthority().equals("ROLE_SYSTEM_ADMIN"));
        return bookingService.getApprovalsForLabManager(principal.getUserId(), principal.getDepartmentId(), isSystemAdmin, status);
    }

    @GetMapping("/test/researcher-to-lab-manager")
    public List<ResearcherToLabManagerBookingDto> testResearcherToLabManagerFeed() {
        return bookingService.getAllResearcherToLabManagerBookings();
    }

    @PutMapping("/{bookingId}/cancel")
    @PreAuthorize("hasAnyAuthority('CANCEL_BOOKING', 'RESEARCHER', 'ROLE_RESEARCHER', 'LAB_MANAGER', 'ROLE_LAB_MANAGER', 'SYSTEM_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public BookingDto cancel(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long bookingId) {
        return bookingService.cancelBooking(principal.getUserId(), bookingId);
    }

    @PutMapping("/{bookingId}/reschedule")
    @PreAuthorize("hasAnyAuthority('RESCHEDULE_BOOKING', 'RESEARCHER', 'ROLE_RESEARCHER', 'LAB_MANAGER', 'ROLE_LAB_MANAGER', 'SYSTEM_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public BookingDto reschedule(@AuthenticationPrincipal UserPrincipal principal,
                                  @PathVariable Long bookingId,
                                  @Valid @RequestBody RescheduleRequestDto request) {
        return bookingService.rescheduleBooking(principal.getUserId(), bookingId, request);
    }

    @PostMapping("/{bookingId}/approve")
    @PreAuthorize("hasAnyAuthority('APPROVE_BOOKING', 'LAB_MANAGER', 'ROLE_LAB_MANAGER', 'DEPARTMENT_HEAD', 'ROLE_DEPARTMENT_HEAD', 'SYSTEM_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public BookingDto approve(@AuthenticationPrincipal UserPrincipal principal, @PathVariable Long bookingId) {
        boolean isSystemAdmin = principal.getRoleNames().contains("SYSTEM_ADMIN") || principal.getRoleNames().contains("ROLE_SYSTEM_ADMIN")
                || principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SYSTEM_ADMIN") || a.getAuthority().equals("ROLE_SYSTEM_ADMIN"));
        return bookingService.approveBooking(principal.getUserId(), principal.getDepartmentId(), isSystemAdmin, bookingId);
    }

    @PostMapping("/{bookingId}/reject")
    @PreAuthorize("hasAnyAuthority('REJECT_BOOKING', 'LAB_MANAGER', 'ROLE_LAB_MANAGER', 'DEPARTMENT_HEAD', 'ROLE_DEPARTMENT_HEAD', 'SYSTEM_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public BookingDto reject(@AuthenticationPrincipal UserPrincipal principal,
                              @PathVariable Long bookingId,
                              @RequestParam(required = false) String reason) {
        boolean isSystemAdmin = principal.getRoleNames().contains("SYSTEM_ADMIN") || principal.getRoleNames().contains("ROLE_SYSTEM_ADMIN")
                || principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("SYSTEM_ADMIN") || a.getAuthority().equals("ROLE_SYSTEM_ADMIN"));
        return bookingService.rejectBooking(principal.getUserId(), principal.getDepartmentId(), isSystemAdmin, bookingId, reason);
    }
}
