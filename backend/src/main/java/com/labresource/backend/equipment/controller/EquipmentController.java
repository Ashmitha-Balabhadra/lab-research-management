package com.labresource.backend.equipment.controller;

import com.labresource.backend.equipment.dto.EquipmentDepartmentAccessDto;
import com.labresource.backend.equipment.dto.EquipmentDto;
import com.labresource.backend.equipment.dto.EquipmentOperatingScheduleDto;
import com.labresource.backend.equipment.service.EquipmentService;
import com.labresource.backend.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;

    @GetMapping("/search")
    @PreAuthorize("hasAuthority('VIEW_EQUIPMENT')")
    public List<EquipmentDto> search(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Long institutionId,
            @RequestParam(required = false) String status) {
        return equipmentService.search(query, category, departmentId, institutionId, status);
    }

    @GetMapping("/{equipmentId}")
    @PreAuthorize("hasAuthority('VIEW_EQUIPMENT')")
    public EquipmentDto getById(@PathVariable Long equipmentId) {
        return equipmentService.getById(equipmentId);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGE_EQUIPMENT')")
    public EquipmentDto create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody EquipmentDto dto) {
        dto.setInstitutionId(principal.getInstitutionId());
        return equipmentService.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_EQUIPMENT')")
    public EquipmentDto update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id, 
            @Valid @RequestBody EquipmentDto dto) {
        dto.setInstitutionId(principal.getInstitutionId());
        return equipmentService.update(id, dto);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('MANAGE_EQUIPMENT')")
    public EquipmentDto updateStatus(@PathVariable Long id, @RequestParam String status) {
        return equipmentService.updateStatus(id, status, false);
    }

    @PostMapping("/{id}/schedule")
    @PreAuthorize("hasAuthority('MANAGE_EQUIPMENT')")
    public Map<String, String> setSchedules(@PathVariable Long id, @RequestBody List<EquipmentOperatingScheduleDto> schedules) {
        equipmentService.setSchedules(id, schedules);
        return Map.of("message", "Schedules updated successfully.");
    }

    @PostMapping("/{id}/documents")
    @PreAuthorize("hasAuthority('MANAGE_EQUIPMENT')")
    public Map<String, String> uploadDocument(
            @PathVariable Long id,
            @RequestParam String documentType,
            @RequestParam MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal) throws IOException {
        equipmentService.uploadDocument(id, documentType, file, principal.getUserId());
        return Map.of("message", "Document uploaded successfully.");
    }

    @PostMapping("/{id}/image")
    @PreAuthorize("hasAuthority('MANAGE_EQUIPMENT')")
    public Map<String, String> uploadImage(@PathVariable Long id, @RequestParam MultipartFile file) throws IOException {
        equipmentService.uploadImage(id, file);
        return Map.of("message", "Image uploaded successfully.");
    }

    @PostMapping("/{id}/access")
    @PreAuthorize("hasAuthority('MANAGE_EQUIPMENT')")
    public Map<String, String> setAccess(@PathVariable Long id, @RequestBody List<EquipmentDepartmentAccessDto> accessList) {
        equipmentService.setAccess(id, accessList);
        return Map.of("message", "Access rules updated successfully.");
    }
}
