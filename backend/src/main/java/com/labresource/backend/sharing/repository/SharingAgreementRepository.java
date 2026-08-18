package com.labresource.backend.sharing.repository;

import com.labresource.backend.sharing.entity.SharingAgreement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface SharingAgreementRepository extends JpaRepository<SharingAgreement, Long> {
    List<SharingAgreement> findByEquipmentId(Long equipmentId);

    @Query("SELECT sa FROM SharingAgreement sa WHERE sa.equipmentId = :equipmentId " +
           "AND sa.status = 'APPROVED' AND :date >= sa.startDate AND :date <= sa.endDate")
    List<SharingAgreement> findActiveAgreement(@Param("equipmentId") Long equipmentId, @Param("date") LocalDate date);
}
