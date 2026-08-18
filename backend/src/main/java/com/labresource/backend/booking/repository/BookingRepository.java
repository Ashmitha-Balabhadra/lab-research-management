package com.labresource.backend.booking.repository;

import com.labresource.backend.booking.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdAndStatusInOrderByStartTimeAsc(Long userId, List<String> statuses);

    List<Booking> findByUserIdAndStatusInOrderByStartTimeDesc(Long userId, List<String> statuses);

    long countByUserId(Long userId);

    long countByUserIdAndStatus(Long userId, String status);

    @Query("SELECT b FROM Booking b WHERE b.equipmentId = :equipmentId " +
           "AND b.status IN ('PENDING_APPROVAL','CONFIRMED','IN_USE') " +
           "AND b.startTime < :end AND b.endTime > :start " +
           "AND (:excludeBookingId IS NULL OR b.bookingId <> :excludeBookingId)")
    List<Booking> findOverlapping(@Param("equipmentId") Long equipmentId,
                                   @Param("start") LocalDateTime start,
                                   @Param("end") LocalDateTime end,
                                   @Param("excludeBookingId") Long excludeBookingId);
}
