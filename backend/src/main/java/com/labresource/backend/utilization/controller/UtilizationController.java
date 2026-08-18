package com.labresource.backend.utilization.controller;

import com.labresource.backend.utilization.entity.UtilizationMetric;
import com.labresource.backend.utilization.service.UtilizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/utilization")
@RequiredArgsConstructor
public class UtilizationController {

    private final UtilizationService utilizationService;

    @GetMapping("/equipment/{equipmentId}")
    @PreAuthorize("hasAuthority('VIEW_UTILIZATION_ANALYTICS')")
    public List<UtilizationMetric> getEquipmentHistory(
            @PathVariable Long equipmentId,
            @RequestParam String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return utilizationService.getEquipmentHistory(equipmentId, period, from, to);
    }

    @GetMapping("/department/{departmentId}")
    @PreAuthorize("hasAuthority('VIEW_UTILIZATION_ANALYTICS')")
    public List<UtilizationMetric> getDepartmentHistory(
            @PathVariable Long departmentId,
            @RequestParam String period) {
        return utilizationService.getDepartmentHistory(departmentId, period);
    }

    @GetMapping("/heatmap")
    @PreAuthorize("hasAuthority('VIEW_UTILIZATION_ANALYTICS')")
    public List<Map<String, Object>> getHeatmap(
            @RequestParam String scope,
            @RequestParam(required = false) Long id,
            @RequestParam(required = false) String period) {
        return utilizationService.getHeatmap(scope, id, period);
    }
}
