package com.labresource.backend.equipment.repository;

import com.labresource.backend.equipment.entity.EquipmentDepartmentAccess;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentDepartmentAccessRepository extends JpaRepository<EquipmentDepartmentAccess, EquipmentDepartmentAccess.IdClass> {
    List<EquipmentDepartmentAccess> findByEquipmentId(Long equipmentId);
    List<EquipmentDepartmentAccess> findByDepartmentId(Long departmentId);
}
