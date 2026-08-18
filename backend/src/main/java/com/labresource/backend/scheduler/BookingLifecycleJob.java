package com.labresource.backend.scheduler;

import com.labresource.backend.booking.entity.Booking;
import com.labresource.backend.booking.repository.BookingRepository;
import com.labresource.backend.equipment.entity.Equipment;
import com.labresource.backend.equipment.repository.EquipmentRepository;
import com.labresource.backend.utilization.entity.UtilizationLog;
import com.labresource.backend.utilization.repository.UtilizationLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BookingLifecycleJob {

    private final BookingRepository bookingRepository;
    private final EquipmentRepository equipmentRepository;
    private final UtilizationLogRepository utilizationLogRepository;

    @Scheduled(cron = "0 */5 * * * *") // Runs every 5 minutes
    @Transactional
    public void processBookingLifecycle() {
        log.info("Running BookingLifecycleJob...");
        LocalDateTime now = LocalDateTime.now();

        // 1. Transition CONFIRMED -> IN_USE
        List<Booking> startingBookings = bookingRepository.findAll().stream()
                .filter(b -> Booking.CONFIRMED.equals(b.getStatus()) && !b.getStartTime().isAfter(now))
                .toList();

        for (Booking booking : startingBookings) {
            log.info("Transitioning booking ID {} to IN_USE", booking.getBookingId());
            booking.setStatus(Booking.IN_USE);
            bookingRepository.save(booking);

            // Set Equipment status to BOOKED
            equipmentRepository.findById(booking.getEquipmentId()).ifPresent(eq -> {
                eq.setStatus(Equipment.BOOKED);
                equipmentRepository.save(eq);
            });

            // Create UtilizationLog entry
            if (utilizationLogRepository.findByBookingId(booking.getBookingId()).isEmpty()) {
                UtilizationLog logEntry = new UtilizationLog();
                logEntry.setEquipmentId(booking.getEquipmentId());
                logEntry.setBookingId(booking.getBookingId());
                logEntry.setUsageStartTime(booking.getStartTime());
                logEntry.setSource("MANUAL");
                utilizationLogRepository.save(logEntry);
            }
        }

        // 2. Transition IN_USE -> COMPLETED
        List<Booking> endingBookings = bookingRepository.findAll().stream()
                .filter(b -> Booking.IN_USE.equals(b.getStatus()) && !b.getEndTime().isAfter(now))
                .toList();

        for (Booking booking : endingBookings) {
            log.info("Transitioning booking ID {} to COMPLETED", booking.getBookingId());
            booking.setStatus(Booking.COMPLETED);
            bookingRepository.save(booking);

            // Restore Equipment status to AVAILABLE
            equipmentRepository.findById(booking.getEquipmentId()).ifPresent(eq -> {
                eq.setStatus(Equipment.AVAILABLE);
                equipmentRepository.save(eq);
            });

            // Close UtilizationLog entry
            utilizationLogRepository.findByBookingId(booking.getBookingId()).ifPresent(logEntry -> {
                logEntry.setUsageEndTime(booking.getEndTime());
                long minutes = Duration.between(logEntry.getUsageStartTime(), booking.getEndTime()).toMinutes();
                logEntry.setDurationMinutes((int) minutes);
                utilizationLogRepository.save(logEntry);
            });
        }
    }
}
