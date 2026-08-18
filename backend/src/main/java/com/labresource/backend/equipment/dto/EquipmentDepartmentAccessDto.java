package com.labresource.backend.equipment.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class EquipmentDepartmentAccessDto {
    private Long departmentId;
    private String accessLevel;
}
