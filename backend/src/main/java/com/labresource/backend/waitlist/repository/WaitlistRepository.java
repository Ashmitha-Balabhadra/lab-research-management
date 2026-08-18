package com.labresource.backend.waitlist.repository;

import com.labresource.backend.waitlist.entity.Waitlist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WaitlistRepository extends JpaRepository<Waitlist, Long> {
    List<Waitlist> findByUserIdAndStatusInOrderByPositionAsc(Long userId, List<String> statuses);

    Optional<Waitlist> findFirstByEquipmentIdOrderByPositionDesc(Long equipmentId);

    List<Waitlist> findByEquipmentIdAndStatusOrderByPositionAsc(Long equipmentId, String status);
}
