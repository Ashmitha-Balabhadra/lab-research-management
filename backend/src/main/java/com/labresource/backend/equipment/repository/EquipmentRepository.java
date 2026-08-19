package com.labresource.backend.equipment.repository;

import com.labresource.backend.equipment.entity.Equipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface EquipmentRepository extends JpaRepository<Equipment, Long> {

    @Query("SELECT e FROM Equipment e WHERE " +
           "(cast(:search as string) IS NULL OR LOWER(e.name) LIKE LOWER(CONCAT('%', cast(:search as string), '%')) " +
           "  OR LOWER(e.category) LIKE LOWER(CONCAT('%', cast(:search as string), '%'))) " +
           "AND (cast(:category as string) IS NULL OR e.category = :category) " +
           "AND (cast(:departmentId as long) IS NULL OR e.departmentId = :departmentId) " +
           "AND (cast(:institutionId as long) IS NULL OR e.institutionId = :institutionId) " +
           "AND (cast(:status as string) IS NULL OR e.status = :status)")
    List<Equipment> search(@Param("search") String search,
                            @Param("category") String category,
                            @Param("departmentId") Long departmentId,
                            @Param("institutionId") Long institutionId,
                            @Param("status") String status);
}
