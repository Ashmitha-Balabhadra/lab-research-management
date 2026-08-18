package com.labresource.backend.report.repository;

import com.labresource.backend.report.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByInstitutionIdOrderByGeneratedAtDesc(Long institutionId);
    List<Report> findByDepartmentIdOrderByGeneratedAtDesc(Long departmentId);
}
