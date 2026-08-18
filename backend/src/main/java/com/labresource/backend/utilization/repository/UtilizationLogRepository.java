package com.labresource.backend.utilization.repository;

import com.labresource.backend.utilization.entity.UtilizationLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UtilizationLogRepository extends JpaRepository<UtilizationLog, Long> {
    Optional<UtilizationLog> findByBookingId(Long bookingId);
    List<UtilizationLog> findByEquipmentId(Long equipmentId);
}
