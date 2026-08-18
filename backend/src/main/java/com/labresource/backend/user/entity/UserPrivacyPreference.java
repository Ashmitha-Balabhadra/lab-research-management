package com.labresource.backend.user.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "UserPrivacyPreference")
@Getter
@Setter
@NoArgsConstructor
public class UserPrivacyPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "preference_id")
    private Long preferenceId;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "profile_visible", nullable = false)
    private Boolean profileVisible = true;

    @Column(name = "email_visible", nullable = false)
    private Boolean emailVisible = false;

    @Column(name = "phone_visible", nullable = false)
    private Boolean phoneVisible = false;

    @Column(name = "analytics_consent", nullable = false)
    private Boolean analyticsConsent = false;

    @Column(name = "data_processing_consent", nullable = false)
    private Boolean dataProcessingConsent = true;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;
}
