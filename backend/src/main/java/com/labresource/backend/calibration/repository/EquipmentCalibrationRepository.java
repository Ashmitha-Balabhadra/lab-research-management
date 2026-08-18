package com.labresource.backend.calibration.repository;

import com.labresource.backend.calibration.entity.EquipmentCalibration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipmentCalibrationRepository extends JpaRepository<EquipmentCalibration, Long> {
    List<EquipmentCalibration> findByEquipmentIdOrderByNextDueDateDesc(Long equipmentId);
}
