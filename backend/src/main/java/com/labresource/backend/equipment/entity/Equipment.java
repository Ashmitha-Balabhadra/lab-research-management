package com.labresource.backend.equipment.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "Equipment")
@Getter
@Setter
@NoArgsConstructor
public class Equipment {

    public static final String AVAILABLE = "AVAILABLE";
    public static final String BOOKED = "BOOKED";
    public static final String UNDER_MAINTENANCE = "UNDER_MAINTENANCE";
    public static final String OUT_OF_SERVICE = "OUT_OF_SERVICE";
    public static final String RETIRED = "RETIRED";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "equipment_id")
    private Long equipmentId;

    @Column(name = "institution_id", nullable = false)
    private Long institutionId;

    @Column(name = "department_id", nullable = false)
    private Long departmentId;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "serial_number", nullable = false, unique = true, length = 100)
    private String serialNumber;

    @Column(name = "manufacturer", length = 100)
    private String manufacturer;

    @Column(name = "model", length = 100)
    private String model;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "purchase_cost")
    private BigDecimal purchaseCost;

    @Column(name = "specifications", columnDefinition = "json")
    private String specifications; // JSON string representing specifications

    @Column(name = "status", nullable = false, length = 30)
    private String status = AVAILABLE;

    @Column(name = "location", length = 150)
    private String location;

    @Column(name = "capacity_per_slot", nullable = false)
    private Integer capacityPerSlot = 1;

    @Column(name = "is_shareable", nullable = false)
    private Boolean isShareable = false;

    @Column(name = "calibration_required", nullable = false)
    private Boolean calibrationRequired = false;

    @Column(name = "calibration_interval_months")
    private Integer calibrationIntervalMonths;

    @Column(name = "image_public_id", length = 500)
    private String imagePublicId;

    @Column(name = "image_secure_url", length = 1000)
    private String imageSecureUrl;

    @Column(name = "image_file_name", length = 255)
    private String imageFileName;

    @Column(name = "image_content_type", length = 100)
    private String imageContentType;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "EquipmentTag",
            joinColumns = @JoinColumn(name = "equipment_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();
}
