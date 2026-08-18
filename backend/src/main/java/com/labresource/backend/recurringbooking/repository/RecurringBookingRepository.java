package com.labresource.backend.recurringbooking.repository;

import com.labresource.backend.recurringbooking.entity.RecurringBooking;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecurringBookingRepository extends JpaRepository<RecurringBooking, Long> {
    List<RecurringBooking> findByStatus(String status);
}
