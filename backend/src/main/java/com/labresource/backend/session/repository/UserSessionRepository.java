package com.labresource.backend.session.repository;

import com.labresource.backend.session.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    List<UserSession> findByUserIdAndSessionStatus(Long userId, String sessionStatus);
}
