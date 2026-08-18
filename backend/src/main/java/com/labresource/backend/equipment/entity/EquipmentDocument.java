package com.labresource.backend.equipment.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "EquipmentDocument")
@Getter
@Setter
@NoArgsConstructor
public class EquipmentDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "document_id")
    private Long documentId;

    @Column(name = "equipment_id", nullable = false)
    private Long equipmentId;

    @Column(name = "document_type", nullable = false, length = 30)
    private String documentType; // MANUAL, DATASHEET, USER_GUIDE, SAFETY_DOCUMENT, OTHER

    @Column(name = "document_name", nullable = false, length = 255)
    private String documentName;

    @Column(name = "cloudinary_public_id", nullable = false, length = 500)
    private String cloudinaryPublicId;

    @Column(name = "cloudinary_secure_url", length = 1000)
    private String cloudinarySecureUrl;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "uploaded_by", nullable = false)
    private Long uploadedBy;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
