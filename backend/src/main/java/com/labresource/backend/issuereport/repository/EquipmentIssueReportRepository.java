package com.labresource.backend.issuereport.repository;

import com.labresource.backend.issuereport.entity.EquipmentIssueReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EquipmentIssueReportRepository extends JpaRepository<EquipmentIssueReport, Long> {
    List<EquipmentIssueReport> findByReportedByOrderByCreatedAtDesc(Long userId);

    @Query("SELECT r FROM EquipmentIssueReport r JOIN Equipment e ON r.equipmentId = e.equipmentId WHERE e.departmentId = :departmentId ORDER BY r.createdAt DESC")
    List<EquipmentIssueReport> findByDepartmentIdOrderByCreatedAtDesc(@Param("departmentId") Long departmentId);

    @Query("SELECT r FROM EquipmentIssueReport r JOIN Equipment e ON r.equipmentId = e.equipmentId WHERE e.departmentId = :departmentId AND r.status = :status ORDER BY r.createdAt DESC")
    List<EquipmentIssueReport> findByDepartmentIdAndStatusOrderByCreatedAtDesc(@Param("departmentId") Long departmentId, @Param("status") String status);
}
