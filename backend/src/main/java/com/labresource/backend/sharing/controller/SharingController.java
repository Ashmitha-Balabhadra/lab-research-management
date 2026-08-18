package com.labresource.backend.sharing.controller;

import com.labresource.backend.security.UserPrincipal;
import com.labresource.backend.sharing.entity.ResourceSharingRequest;
import com.labresource.backend.sharing.entity.SharingAgreement;
import com.labresource.backend.sharing.service.SharingService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/sharing")
@RequiredArgsConstructor
public class SharingController {

    private final SharingService sharingService;

    @PostMapping("/requests")
    public ResourceSharingRequest submitRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam Long equipmentId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String purpose) {
        return sharingService.submitRequest(principal.getInstitutionId(), principal.getUserId(), equipmentId, startDate, endDate, purpose);
    }

    @PostMapping("/requests/{id}/approve")
    @PreAuthorize("hasAnyAuthority('APPROVE_SHARING_REQUEST', 'ROLE_LAB_MANAGER', 'ROLE_SYSTEM_ADMIN')")
    public SharingAgreement approveRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @RequestParam(required = false) String costSharingTerms) {
        return sharingService.approveRequest(principal.getUserId(), id, costSharingTerms);
    }

    @PostMapping("/requests/{id}/reject")
    @PreAuthorize("hasAnyAuthority('APPROVE_SHARING_REQUEST', 'ROLE_LAB_MANAGER', 'ROLE_SYSTEM_ADMIN')")
    public ResourceSharingRequest rejectRequest(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id) {
        return sharingService.rejectRequest(principal.getUserId(), id);
    }

    @GetMapping("/requests/incoming")
    public List<ResourceSharingRequest> getIncoming(@AuthenticationPrincipal UserPrincipal principal) {
        return sharingService.getIncomingRequests(principal.getInstitutionId());
    }

    @GetMapping("/requests/outgoing")
    public List<ResourceSharingRequest> getOutgoing(@AuthenticationPrincipal UserPrincipal principal) {
        return sharingService.getOutgoingRequests(principal.getInstitutionId());
    }

    @GetMapping("/agreements")
    public List<SharingAgreement> getAgreements(@RequestParam Long equipmentId) {
        return sharingService.getAgreementsForEquipment(equipmentId);
    }
}
