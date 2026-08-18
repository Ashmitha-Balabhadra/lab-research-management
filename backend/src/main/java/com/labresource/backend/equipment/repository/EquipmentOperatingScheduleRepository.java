package com.labresource.backend.equipment.repository;

import com.labresource.backend.equipment.entity.EquipmentOperatingSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EquipmentOperatingScheduleRepository extends JpaRepository<EquipmentOperatingSchedule, Long> {
    List<EquipmentOperatingSchedule> findByEquipmentId(Long equipmentId);
    Optional<EquipmentOperatingSchedule> findByEquipmentIdAndDayOfWeek(Long equipmentId, Integer dayOfWeek);
}
