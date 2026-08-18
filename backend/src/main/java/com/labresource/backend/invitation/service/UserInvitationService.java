package com.labresource.backend.invitation.service;

import com.labresource.backend.common.exception.ApiException;
import com.labresource.backend.common.util.EmailService;
import com.labresource.backend.invitation.dto.InvitationRequestDto;
import com.labresource.backend.invitation.entity.UserInvitation;
import com.labresource.backend.invitation.repository.UserInvitationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserInvitationService {

    private final UserInvitationRepository userInvitationRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void inviteUser(Long inviterId, InvitationRequestDto request) {
        String token = UUID.randomUUID().toString();
        String tokenHash = passwordEncoder.encode(token);

        log.info("Creating invitation for: {}. Token: {} (use this token to accept)", request.getEmail(), token);

        UserInvitation invitation = new UserInvitation();
        invitation.setEmail(request.getEmail().toLowerCase());
        invitation.setInstitutionId(request.getInstitutionId());
        invitation.setDepartmentId(request.getDepartmentId());
        invitation.setRoleId(request.getRoleId());
        invitation.setInvitedBy(inviterId);
        invitation.setTokenHash(tokenHash);
        invitation.setExpiresAt(LocalDateTime.now().plusDays(7)); // expires in 7 days
        invitation.setStatus("PENDING");

        userInvitationRepository.save(invitation);

        String inviteLink = "http://localhost:5173/accept-invitation?token=" + token;
        String emailBody = "You have been invited to join the Lab Resource Platform.\n" +
                "Click the link below to accept and complete your registration:\n" +
                inviteLink;

        emailService.sendEmail(request.getEmail(), "Lab Resource Platform Invitation", emailBody);
    }

    public UserInvitation verifyAndGetInvitation(String token) {
        // Since bcrypt cannot be decrypted, we have to fetch all PENDING and verify.
        // For simplicity in this demo, let's load all invitations and verify against tokenHash using passwordEncoder.
        return userInvitationRepository.findAll().stream()
                .filter(inv -> "PENDING".equals(inv.getStatus()) && passwordEncoder.matches(token, inv.getTokenHash()))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired invitation token."));
    }

    @Transactional
    public void acceptInvitation(Long invitationId) {
        UserInvitation invitation = userInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invitation not found."));

        if (!"PENDING".equals(invitation.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invitation has already been " + invitation.getStatus().toLowerCase());
        }

        invitation.setStatus("ACCEPTED");
        invitation.setAcceptedAt(LocalDateTime.now());
        userInvitationRepository.save(invitation);
    }
}
