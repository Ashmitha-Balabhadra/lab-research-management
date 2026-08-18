package com.labresource.backend.issuereport.controller;

import com.labresource.backend.issuereport.dto.EligibleBookingDto;
import com.labresource.backend.issuereport.dto.IssueReportRequestDto;
import com.labresource.backend.issuereport.entity.EquipmentIssueReport;
import com.labresource.backend.issuereport.service.EquipmentIssueReportService;
import com.labresource.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issue-reports")
@RequiredArgsConstructor
public class EquipmentIssueReportController {

    private final EquipmentIssueReportService issueReportService;

    @GetMapping("/eligible-bookings")
    public List<EligibleBookingDto> getEligibleBookings(@AuthenticationPrincipal UserPrincipal principal) {
        return issueReportService.getEligibleBookings(principal.getUserId());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('REPORT_EQUIPMENT_ISSUE')")
    public EquipmentIssueReport reportIssue(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody IssueReportRequestDto dto) {
        return issueReportService.reportIssue(principal.getUserId(), dto);
    }

    @GetMapping("/my")
    public List<EquipmentIssueReport> myReports(@AuthenticationPrincipal UserPrincipal principal) {
        return issueReportService.myReports(principal.getUserId());
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('VIEW_EQUIPMENT_ISSUES', 'ROLE_LAB_MANAGER', 'ROLE_SYSTEM_ADMIN')")
    public List<EquipmentIssueReport> getDepartmentIssues(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String status) {
        return issueReportService.getDepartmentIssues(principal.getDepartmentId(), status);
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyAuthority('ASSIGN_EQUIPMENT_ISSUE', 'ROLE_LAB_MANAGER', 'ROLE_SYSTEM_ADMIN')")
    public EquipmentIssueReport assignTechnician(@PathVariable Long id, @RequestParam Long technicianId) {
        return issueReportService.assignTechnician(id, technicianId);
    }

    @PostMapping("/{id}/resolve")
    @PreAuthorize("hasAnyAuthority('RESOLVE_EQUIPMENT_ISSUE', 'ROLE_LAB_MANAGER', 'ROLE_SYSTEM_ADMIN')")
    public EquipmentIssueReport resolveIssue(@PathVariable Long id) {
        return issueReportService.resolveIssue(id);
    }
}
