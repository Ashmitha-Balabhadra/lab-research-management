package com.labresource.backend.waitlist.service;

import com.labresource.backend.booking.entity.Booking;
import com.labresource.backend.booking.repository.BookingRepository;
import com.labresource.backend.common.exception.ApiException;
import com.labresource.backend.equipment.entity.Equipment;
import com.labresource.backend.equipment.service.EquipmentService;
import com.labresource.backend.notification.service.NotificationService;
import com.labresource.backend.waitlist.dto.WaitlistDto;
import com.labresource.backend.waitlist.dto.WaitlistRequestDto;
import com.labresource.backend.waitlist.entity.Waitlist;
import com.labresource.backend.waitlist.repository.WaitlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WaitlistService {

    private final WaitlistRepository waitlistRepository;
    private final BookingRepository bookingRepository;
    private final EquipmentService equipmentService;
    private final NotificationService notificationService;

    @Transactional
    public WaitlistDto join(Long userId, WaitlistRequestDto request) {
        Equipment equipment = equipmentService.getEntity(request.getEquipmentId());

        int nextPosition = waitlistRepository.findFirstByEquipmentIdOrderByPositionDesc(equipment.getEquipmentId())
                .map(w -> w.getPosition() + 1)
                .orElse(1);

        Waitlist waitlist = new Waitlist();
        waitlist.setEquipmentId(equipment.getEquipmentId());
        waitlist.setUserId(userId);
        waitlist.setRequestedStartTime(request.getRequestedStartTime());
        waitlist.setRequestedEndTime(request.getRequestedEndTime());
        waitlist.setPosition(nextPosition);
        waitlist.setStatus("WAITING");

        Waitlist saved = waitlistRepository.save(waitlist);
        return WaitlistDto.fromEntity(saved, equipment.getName());
    }

    public List<WaitlistDto> myWaitlist(Long userId) {
        List<String> activeStatuses = List.of("WAITING", "NOTIFIED");
        return waitlistRepository.findByUserIdAndStatusInOrderByPositionAsc(userId, activeStatuses).stream()
                .map(w -> WaitlistDto.fromEntity(w, equipmentService.getEntity(w.getEquipmentId()).getName()))
                .toList();
    }

    @Transactional
    public void promoteNext(Long equipmentId, LocalDateTime freedStart, LocalDateTime freedEnd) {
        log.info("Attempting to promote next user on waitlist for Equipment ID: {}", equipmentId);

        // Find the top WAITING entry sorted by position
        List<Waitlist> queue = waitlistRepository.findByEquipmentIdAndStatusOrderByPositionAsc(equipmentId, "WAITING");

        for (Waitlist entry : queue) {
            // Check if user's requested window fits or overlaps inside freed slot
            if (!entry.getRequestedStartTime().isAfter(freedEnd) && !entry.getRequestedEndTime().isBefore(freedStart)) {
                log.info("Promoting waitlist entry ID: {}, User ID: {}", entry.getWaitlistId(), entry.getUserId());
                entry.setStatus("NOTIFIED");
                entry.setExpiresAt(LocalDateTime.now().plusMinutes(30)); // 30 mins to confirm
                waitlistRepository.save(entry);

                // Notify user
                Equipment eq = equipmentService.getEntity(equipmentId);
                notificationService.notifyUser(entry.getUserId(), "WAITLIST_PROMOTED", "Waitlist Slot Available",
                        "The time slot you requested for \"" + eq.getName() + "\" is now available! You have 30 minutes to confirm booking.");
                return; // Only promote one person at a time per freed slot
            }
        }
    }

    @Transactional
    public Booking confirm(Long userId, Long waitlistId) {
        Waitlist entry = waitlistRepository.findById(waitlistId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Waitlist entry not found."));

        if (!entry.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This waitlist entry does not belong to you.");
        }

        if (!"NOTIFIED".equals(entry.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This slot is not notified or has expired.");
        }

        if (entry.getExpiresAt().isBefore(LocalDateTime.now())) {
            entry.setStatus("EXPIRED");
            waitlistRepository.save(entry);
            throw new ApiException(HttpStatus.BAD_REQUEST, "The confirmation window for this slot has expired.");
        }

        Equipment equipment = equipmentService.getEntity(entry.getEquipmentId());

        // Create the booking
        Booking booking = new Booking();
        booking.setEquipmentId(entry.getEquipmentId());
        booking.setUserId(userId);
        booking.setInstitutionId(equipment.getInstitutionId());
        booking.setDepartmentId(equipment.getDepartmentId());
        booking.setStartTime(entry.getRequestedStartTime());
        booking.setEndTime(entry.getRequestedEndTime());
        booking.setStatus(Booking.CONFIRMED);
        booking.setIsRecurring(false);
        booking.setPurpose("Waitlist confirmation");

        Booking savedBooking = bookingRepository.save(booking);

        // Update waitlist entry
        entry.setStatus("BOOKED");
        entry.setBookingId(savedBooking.getBookingId());
        waitlistRepository.save(entry);

        log.info("Waitlist confirmed successfully. Booking ID: {}", savedBooking.getBookingId());
        return savedBooking;
    }
}
