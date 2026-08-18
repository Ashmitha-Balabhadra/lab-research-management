package com.labresource.backend.scheduler;

import com.labresource.backend.waitlist.entity.Waitlist;
import com.labresource.backend.waitlist.repository.WaitlistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WaitlistExpiryJob {

    private final WaitlistRepository waitlistRepository;
    private final com.labresource.backend.waitlist.service.WaitlistService waitlistService;

    @Scheduled(cron = "0 */10 * * * *") // run every 10 minutes
    @Transactional
    public void expireWaitlistBookings() {
        log.info("Running WaitlistExpiryJob...");
        // Fetch waitlist entries that are in 'NOTIFIED' state but have expired
        List<Waitlist> expired = waitlistRepository.findAll().stream()
                .filter(w -> "NOTIFIED".equals(w.getStatus()) && w.getExpiresAt() != null && w.getExpiresAt().isBefore(LocalDateTime.now()))
                .toList();

        for (Waitlist w : expired) {
            log.info("Expiring waitlist notification for entry: {}, user: {}", w.getWaitlistId(), w.getUserId());
            w.setStatus("EXPIRED");
            waitlistRepository.save(w);
            
            // Cascade and notify the next person in line for this slot
            waitlistService.promoteNext(w.getEquipmentId(), w.getRequestedStartTime(), w.getRequestedEndTime());
        }
    }
}
