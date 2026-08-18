package com.labresource.backend.report.controller;

import com.labresource.backend.report.entity.Report;
import com.labresource.backend.report.service.ReportService;
import com.labresource.backend.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyAuthority('ROLE_LAB_MANAGER', 'ROLE_DEPARTMENT_HEAD', 'ROLE_SYSTEM_ADMIN')")
    public Report generateReport(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam String reportType,
            @RequestParam(required = false) Long departmentId,
            @RequestParam String format) throws IOException {
        return reportService.generateReport(
                principal.getUserId(),
                principal.getInstitutionId(),
                departmentId != null ? departmentId : principal.getDepartmentId(),
                reportType,
                format
        );
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_LAB_MANAGER', 'ROLE_DEPARTMENT_HEAD', 'ROLE_SYSTEM_ADMIN')")
    public List<Report> getReports(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Long departmentId) {
        return reportService.getReports(principal.getInstitutionId(), departmentId);
    }
}
