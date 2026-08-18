package com.labresource.backend.booking.dto;

import com.labresource.backend.booking.entity.Booking;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class BookingDto {
    private Long bookingId;
    private Long equipmentId;
    private String equipmentName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private String purpose;
    private Boolean isRecurring;
    private String recurrencePattern;
    private LocalDateTime createdAt;

    public static BookingDto fromEntity(Booking b, String equipmentName) {
        BookingDto dto = new BookingDto();
        dto.setBookingId(b.getBookingId());
        dto.setEquipmentId(b.getEquipmentId());
        dto.setEquipmentName(equipmentName);
        dto.setStartTime(b.getStartTime());
        dto.setEndTime(b.getEndTime());
        dto.setStatus(b.getStatus());
        dto.setPurpose(b.getPurpose());
        dto.setIsRecurring(b.getIsRecurring());
        dto.setRecurrencePattern(b.getRecurrencePattern());
        dto.setCreatedAt(b.getCreatedAt());
        return dto;
    }
}
