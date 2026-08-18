package com.labresource.backend.institution.dto;

import com.labresource.backend.institution.entity.Institution;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class InstitutionDto {
    private Long institutionId;
    private String name;
    private String address;
    private String city;
    private String state;
    private String country;
    private String contactEmail;
    private String contactPhone;

    public static InstitutionDto fromEntity(Institution i) {
        InstitutionDto dto = new InstitutionDto();
        dto.setInstitutionId(i.getInstitutionId());
        dto.setName(i.getName());
        dto.setAddress(i.getAddress());
        dto.setCity(i.getCity());
        dto.setState(i.getState());
        dto.setCountry(i.getCountry());
        dto.setContactEmail(i.getContactEmail());
        dto.setContactPhone(i.getContactPhone());
        return dto;
    }
}
