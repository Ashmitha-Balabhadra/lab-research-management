package com.labresource.backend.scheduler;

import com.labresource.backend.invitation.entity.UserInvitation;
import com.labresource.backend.invitation.repository.UserInvitationRepository;
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
public class InvitationExpiryJob {

    private final UserInvitationRepository userInvitationRepository;

    @Scheduled(cron = "0 0 1 * * *") // run daily at 1:00 AM
    @Transactional
    public void expireInvitations() {
        log.info("Running InvitationExpiryJob...");
        List<UserInvitation> pending = userInvitationRepository.findAll().stream()
                .filter(i -> "PENDING".equals(i.getStatus()) && i.getExpiresAt().isBefore(LocalDateTime.now()))
                .toList();

        for (UserInvitation invite : pending) {
            invite.setStatus("EXPIRED");
            userInvitationRepository.save(invite);
            log.info("Invitation with ID: {} for email: {} has expired.", invite.getInvitationId(), invite.getEmail());
        }
    }
}
