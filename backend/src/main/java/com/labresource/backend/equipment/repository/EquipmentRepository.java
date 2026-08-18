package com.labresource.backend.equipment.repository;

import com.labresource.backend.equipment.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    @Query("SELECT e FROM Equipment e WHERE " +
           "(:search IS NULL OR LOWER(e.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "  OR LOWER(e.category) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:category IS NULL OR e.category = :category) " +
           "AND (:departmentId IS NULL OR e.departmentId = :departmentId) " +
           "AND (:institutionId IS NULL OR e.institutionId = :institutionId) " +
           "AND (:status IS NULL OR e.status = :status)")
    List<Equipment> search(@Param("search") String search,
                            @Param("category") String category,
                            @Param("departmentId") Long departmentId,
                            @Param("institutionId") Long institutionId,
                            @Param("status") String status);
}
