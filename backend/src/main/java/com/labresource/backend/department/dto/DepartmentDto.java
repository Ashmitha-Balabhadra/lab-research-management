package com.labresource.backend.department.dto;

import com.labresource.backend.department.entity.Department;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class DepartmentDto {
    private Long departmentId;
    private String name;
    private Long institutionId;
    private BigDecimal budgetAllocated;

    public static DepartmentDto fromEntity(Department d) {
        DepartmentDto dto = new DepartmentDto();
        dto.setDepartmentId(d.getDepartmentId());
        dto.setName(d.getName());
        dto.setInstitutionId(d.getInstitutionId());
        dto.setBudgetAllocated(d.getBudgetAllocated());
        return dto;
    }
}
