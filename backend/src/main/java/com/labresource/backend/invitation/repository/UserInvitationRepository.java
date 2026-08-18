package com.labresource.backend.invitation.repository;

import com.labresource.backend.invitation.entity.UserInvitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserInvitationRepository extends JpaRepository<UserInvitation, Long> {
    Optional<UserInvitation> findByTokenHash(String tokenHash);
    Optional<UserInvitation> findByEmailAndStatus(String email, String status);
}
