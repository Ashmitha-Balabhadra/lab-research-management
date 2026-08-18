package com.labresource.backend.maintenance.repository;

import com.labresource.backend.maintenance.entity.MaintenanceRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MaintenanceRequestRepository extends JpaRepository<MaintenanceRequest, Long> {
    List<MaintenanceRequest> findByEquipmentIdAndStatusNot(Long equipmentId, String status);
    List<MaintenanceRequest> findByEquipmentId(Long equipmentId);
}
