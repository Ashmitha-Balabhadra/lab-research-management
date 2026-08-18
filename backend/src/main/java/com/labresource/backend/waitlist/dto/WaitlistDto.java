package com.labresource.backend.waitlist.dto;

import com.labresource.backend.waitlist.entity.Waitlist;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class WaitlistDto {
    private Long waitlistId;
    private Long equipmentId;
    private String equipmentName;
    private LocalDateTime requestedStartTime;
    private LocalDateTime requestedEndTime;
    private Integer position;
    private String status;
    private String estimatedWait;

    public static WaitlistDto fromEntity(Waitlist w, String equipmentName) {
        WaitlistDto dto = new WaitlistDto();
        dto.setWaitlistId(w.getWaitlistId());
        dto.setEquipmentId(w.getEquipmentId());
        dto.setEquipmentName(equipmentName);
        dto.setRequestedStartTime(w.getRequestedStartTime());
        dto.setRequestedEndTime(w.getRequestedEndTime());
        dto.setPosition(w.getPosition());
        dto.setStatus(w.getStatus());
        dto.setEstimatedWait(w.getPosition() != null ? ((w.getPosition() - 1) * 2) + "-" + (w.getPosition() * 2) + " days" : null);
        return dto;
    }
}
