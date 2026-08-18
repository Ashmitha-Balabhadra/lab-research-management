package com.labresource.backend.equipment.repository;

import com.labresource.backend.equipment.entity.EquipmentDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipmentDocumentRepository extends JpaRepository<EquipmentDocument, Long> {
    List<EquipmentDocument> findByEquipmentId(Long equipmentId);
}
