package com.labresource.backend.department.service;

import com.labresource.backend.common.exception.ApiException;
import com.labresource.backend.department.dto.DepartmentDto;
import com.labresource.backend.department.entity.Department;
import com.labresource.backend.department.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public List<DepartmentDto> getAll() {
        return departmentRepository.findAll().stream()
                .map(DepartmentDto::fromEntity)
                .toList();
    }

    public List<DepartmentDto> getByInstitutionId(Long institutionId) {
        return departmentRepository.findByInstitutionId(institutionId).stream()
                .map(DepartmentDto::fromEntity)
                .toList();
    }

    public DepartmentDto getById(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Department not found."));
        return DepartmentDto.fromEntity(dept);
    }

    public Department getEntity(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Department not found."));
    }

    @Transactional
    public DepartmentDto create(DepartmentDto dto) {
        // Enforce unique department name within institution
        departmentRepository.findByInstitutionIdAndNameIgnoreCase(dto.getInstitutionId(), dto.getName())
                .ifPresent(d -> {
                    throw new ApiException(HttpStatus.CONFLICT, "A department with this name already exists in this institution.");
                });

        Department dept = new Department();
        dept.setInstitutionId(dto.getInstitutionId());
        dept.setName(dto.getName());
        dept.setBudgetAllocated(dto.getBudgetAllocated() != null ? dto.getBudgetAllocated() : java.math.BigDecimal.ZERO);
        dept.setIsActive(true);
        return DepartmentDto.fromEntity(departmentRepository.save(dept));
    }

    @Transactional
    public DepartmentDto update(Long id, DepartmentDto dto) {
        Department dept = getEntity(id);

        if (!dept.getName().equalsIgnoreCase(dto.getName())) {
            departmentRepository.findByInstitutionIdAndNameIgnoreCase(dept.getInstitutionId(), dto.getName())
                    .ifPresent(d -> {
                        throw new ApiException(HttpStatus.CONFLICT, "A department with this name already exists in this institution.");
                    });
        }

        dept.setName(dto.getName());
        if (dto.getBudgetAllocated() != null) {
            dept.setBudgetAllocated(dto.getBudgetAllocated());
        }
        return DepartmentDto.fromEntity(departmentRepository.save(dept));
    }

    @Transactional
    public void delete(Long id) {
        Department dept = getEntity(id);
        dept.setIsActive(false);
        departmentRepository.save(dept);
    }
}
