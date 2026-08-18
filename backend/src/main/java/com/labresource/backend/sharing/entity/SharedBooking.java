package com.labresource.backend.sharing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "SharedBooking")
@Getter
@Setter
@NoArgsConstructor
public class SharedBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "shared_booking_id")
    private Long sharedBookingId;

    @Column(name = "agreement_id", nullable = false)
    private Long agreementId;

    @Column(name = "booking_id", nullable = false, unique = true)
    private Long bookingId;

    @Column(name = "external_institution_id", nullable = false)
    private Long externalInstitutionId;

    @Column(name = "usage_fee", nullable = false)
    private BigDecimal usageFee = BigDecimal.ZERO;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
