package com.labresource.backend.security;

import com.labresource.backend.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
public class SecurityContextUtil {

    public static UserPrincipal getPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || !(authentication.getPrincipal() instanceof UserPrincipal)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "User is not authenticated.");
        }
        return (UserPrincipal) authentication.getPrincipal();
    }

    public static Long getUserId() {
        return getPrincipal().getUserId();
    }

    public static Long getInstitutionId() {
        return getPrincipal().getInstitutionId();
    }

    public static Long getDepartmentId() {
        return getPrincipal().getDepartmentId();
    }

    public static String getEmail() {
        return getPrincipal().getUsername();
    }
}
