package com.labresource.backend.equipment.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "EquipmentDepartmentAccess")
@IdClass(EquipmentDepartmentAccess.IdClass.class)
@Getter
@Setter
@NoArgsConstructor
public class EquipmentDepartmentAccess {

    @Id
    @Column(name = "equipment_id")
    private Long equipmentId;

    @Id
    @Column(name = "department_id")
    private Long departmentId;

    @Column(name = "access_level", nullable = false, length = 20)
    private String accessLevel; // OWNER, SHARED

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IdClass implements Serializable {
        private Long equipmentId;
        private Long departmentId;
    }
}
