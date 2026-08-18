package com.labresource.backend.equipment.dto;

import com.labresource.backend.equipment.entity.Equipment;
import com.labresource.backend.calibration.entity.EquipmentCalibration;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class EquipmentDto {
    private Long equipmentId;
    private String name;
    private String category;
    private String serialNumber;
    private String manufacturer;
    private String model;
    private String status;
    private String location;
    private Integer capacityPerSlot;
    private Boolean isShareable;
    private Long departmentId;
    private Long institutionId;
    private String imageSecureUrl;
    private String specifications;
    private LocalDate nextCalibrationDue;
    private String calibrationStatus; // VALID / DUE_SOON / OVERDUE / NOT_RECORDED
    private Boolean calibrationRequired;
    private Integer calibrationIntervalMonths;

    public static EquipmentDto fromEntity(Equipment e, EquipmentCalibration latestCalibration) {
        EquipmentDto dto = new EquipmentDto();
        dto.setEquipmentId(e.getEquipmentId());
        dto.setName(e.getName());
        dto.setCategory(e.getCategory());
        dto.setSerialNumber(e.getSerialNumber());
        dto.setManufacturer(e.getManufacturer());
        dto.setModel(e.getModel());
        dto.setStatus(e.getStatus());
        dto.setLocation(e.getLocation());
        dto.setCapacityPerSlot(e.getCapacityPerSlot());
        dto.setIsShareable(e.getIsShareable());
        dto.setDepartmentId(e.getDepartmentId());
        dto.setInstitutionId(e.getInstitutionId());
        dto.setImageSecureUrl(e.getImageSecureUrl());
        dto.setSpecifications(e.getSpecifications());
        dto.setCalibrationRequired(e.getCalibrationRequired());
        dto.setCalibrationIntervalMonths(e.getCalibrationIntervalMonths());

        if (latestCalibration != null) {
            LocalDate due = latestCalibration.getNextDueDate();
            dto.setNextCalibrationDue(due);
            LocalDate today = LocalDate.now();
            if (due.isBefore(today)) {
                dto.setCalibrationStatus("OVERDUE");
            } else if (!due.isAfter(today.plusDays(30))) {
                dto.setCalibrationStatus("DUE_SOON");
            } else {
                dto.setCalibrationStatus("VALID");
            }
        } else {
            dto.setCalibrationStatus("NOT_RECORDED");
        }
        return dto;
    }
}
