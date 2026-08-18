package com.labresource.backend.auth.dto;

import com.labresource.backend.auth.entity.AppUser;
import com.labresource.backend.role.entity.Role;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@Setter
public class UserSummaryDto {
    private Long userId;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private Long institutionId;
    private Long departmentId;
    private String profilePictureSecureUrl;
    private List<String> roles;

    public static UserSummaryDto fromEntity(AppUser user) {
        UserSummaryDto dto = new UserSummaryDto();
        dto.setUserId(user.getUserId());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setInstitutionId(user.getInstitutionId());
        dto.setDepartmentId(user.getDepartmentId());
        dto.setProfilePictureSecureUrl(user.getProfilePictureSecureUrl());
        dto.setRoles(user.getRoles().stream().map(Role::getRoleName).collect(Collectors.toList()));
        return dto;
    }
}
