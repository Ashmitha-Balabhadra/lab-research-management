package com.labresource.backend.department.repository;

import com.labresource.backend.department.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    List<Department> findByInstitutionId(Long institutionId);
    java.util.Optional<Department> findByInstitutionIdAndNameIgnoreCase(Long institutionId, String name);
}
