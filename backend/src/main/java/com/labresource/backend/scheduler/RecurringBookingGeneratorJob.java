package com.labresource.backend.scheduler;

import com.labresource.backend.booking.entity.Booking;
import com.labresource.backend.booking.repository.BookingRepository;
import com.labresource.backend.equipment.repository.EquipmentRepository;
import com.labresource.backend.recurringbooking.entity.RecurringBooking;
import com.labresource.backend.recurringbooking.repository.RecurringBookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RecurringBookingGeneratorJob {

    private final RecurringBookingRepository recurringBookingRepository;
    private final BookingRepository bookingRepository;
    private final EquipmentRepository equipmentRepository;

    @Scheduled(cron = "0 0 0 * * *") // run daily at midnight
    @Transactional
    public void generateBookings() {
        log.info("Running RecurringBookingGeneratorJob...");
        List<RecurringBooking> activeTemplates = recurringBookingRepository.findByStatus("ACTIVE");
        LocalDate today = LocalDate.now();
        LocalDate bookingTargetDate = today.plusWeeks(2); // generate bookings 2 weeks in advance

        for (RecurringBooking template : activeTemplates) {
            if (template.getStartDate().isAfter(bookingTargetDate) || template.getEndDate().isBefore(bookingTargetDate)) {
                continue;
            }

            // Real recurrence pattern check
            boolean matchesRecurrence = false;
            if ("DAILY".equalsIgnoreCase(template.getRecurrencePattern())) {
                matchesRecurrence = true;
            } else if ("WEEKLY".equalsIgnoreCase(template.getRecurrencePattern())) {
                matchesRecurrence = bookingTargetDate.getDayOfWeek() == template.getStartDate().getDayOfWeek();
            } else if ("MONTHLY".equalsIgnoreCase(template.getRecurrencePattern())) {
                matchesRecurrence = bookingTargetDate.getDayOfMonth() == template.getStartDate().getDayOfMonth();
            }

            if (matchesRecurrence) {
                LocalDateTime start = LocalDateTime.of(bookingTargetDate, template.getStartTime());
                LocalDateTime end = LocalDateTime.of(bookingTargetDate, template.getEndTime());

                // check if it conflicts or already exists
                List<Booking> overlapping = bookingRepository.findOverlapping(template.getEquipmentId(), start, end, null);
                if (overlapping.isEmpty()) {
                    Booking booking = new Booking();
                    booking.setEquipmentId(template.getEquipmentId());
                    booking.setUserId(template.getUserId());
                    
                    // Fetch equipment to get the correct institution/department IDs
                    equipmentRepository.findById(template.getEquipmentId()).ifPresent(eq -> {
                        booking.setInstitutionId(eq.getInstitutionId());
                        booking.setDepartmentId(eq.getDepartmentId());
                    });

                    if (booking.getInstitutionId() == null) {
                        booking.setInstitutionId(1L); // Fallback dummy if equipment lookup fails
                    }

                    booking.setStartTime(start);
                    booking.setEndTime(end);
                    booking.setStatus(Booking.CONFIRMED);
                    booking.setIsRecurring(true);
                    booking.setRecurringBookingId(template.getRecurringBookingId());
                    booking.setPurpose("Recurring reservation: " + template.getRecurrencePattern());
                    bookingRepository.save(booking);
                    log.info("Generated booking for target date: {} from template: {}", bookingTargetDate, template.getRecurringBookingId());
                }
            }
        }
    }
}
