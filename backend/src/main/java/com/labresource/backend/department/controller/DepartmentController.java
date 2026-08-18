package com.labresource.backend.department.controller;

import com.labresource.backend.department.dto.DepartmentDto;
import com.labresource.backend.department.service.DepartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping("/{id}")
    public DepartmentDto getById(@PathVariable Long id) {
        return departmentService.getById(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_DEPARTMENT')")
    public DepartmentDto create(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.labresource.backend.security.UserPrincipal principal,
            @Valid @RequestBody DepartmentDto dto) {
        dto.setInstitutionId(principal.getInstitutionId());
        return departmentService.create(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_DEPARTMENT')")
    public DepartmentDto update(@PathVariable Long id, @Valid @RequestBody DepartmentDto dto) {
        return departmentService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DEACTIVATE_DEPARTMENT')")
    public void delete(@PathVariable Long id) {
        departmentService.delete(id);
    }
}
