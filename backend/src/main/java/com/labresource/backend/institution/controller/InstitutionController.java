package com.labresource.backend.institution.controller;

import com.labresource.backend.institution.dto.InstitutionDto;
import com.labresource.backend.institution.service.InstitutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/institutions")
@RequiredArgsConstructor
public class InstitutionController {

    private final InstitutionService institutionService;
    private final com.labresource.backend.department.service.DepartmentService departmentService;

    @GetMapping
    public List<InstitutionDto> getAll() {
        return institutionService.getAll();
    }

    @GetMapping("/{id}")
    public InstitutionDto getById(@PathVariable Long id) {
        return institutionService.getById(id);
    }

    @GetMapping("/{institutionId}/departments")
    public List<com.labresource.backend.department.dto.DepartmentDto> getDepartments(@PathVariable Long institutionId) {
        return departmentService.getByInstitutionId(institutionId);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGE_INSTITUTION')")
    public InstitutionDto create(@Valid @RequestBody InstitutionDto dto) {
        return institutionService.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_INSTITUTION')")
    public InstitutionDto update(@PathVariable Long id, @Valid @RequestBody InstitutionDto dto) {
        return institutionService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_INSTITUTION')")
    public void delete(@PathVariable Long id) {
        institutionService.delete(id);
    }
}
