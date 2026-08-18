package com.labresource.backend.security;

import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.lang.reflect.Method;

@Component
public class CustomPermissionEvaluator implements PermissionEvaluator {

    @Autowired
    private EntityManager entityManager;

    @Override
    public boolean hasPermission(Authentication authentication, Object targetDomainObject, Object permission) {
        if (authentication == null || targetDomainObject == null || !(permission instanceof String)) {
            return false;
        }
        boolean hasAuth = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(permission.toString()));
        if (!hasAuth) return false;

        return verifyOwnership(authentication, targetDomainObject);
    }

    @Override
    public boolean hasPermission(Authentication authentication, Serializable targetId, String targetType, Object permission) {
        if (authentication == null || targetType == null || !(permission instanceof String)) {
            return false;
        }
        boolean hasAuth = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(permission.toString()));
        if (!hasAuth) return false;

        try {
            String packageName = getPackageNameForType(targetType);
            Class<?> entityClass = Class.forName("com.labresource.backend." + packageName + ".entity." + targetType);
            Object targetEntity = entityManager.find(entityClass, targetId);
            if (targetEntity == null) return false;
            return verifyOwnership(authentication, targetEntity);
        } catch (Exception e) {
            // Fallback to basic authority check if target entity class cannot be loaded
            return true;
        }
    }

    private boolean verifyOwnership(Authentication authentication, Object target) {
        if (!(authentication.getPrincipal() instanceof UserPrincipal)) return false;
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        // System Admin bypasses ownership checks
        if (principal.getRoleNames().contains("ROLE_SYSTEM_ADMIN")) {
            return true;
        }

        // Special handling for issue reports (which don't have departmentId directly)
        if (target.getClass().getSimpleName().equals("EquipmentIssueReport")) {
            try {
                Method getEqId = target.getClass().getMethod("getEquipmentId");
                Long equipmentId = (Long) getEqId.invoke(target);
                if (equipmentId != null) {
                    Class<?> eqClass = Class.forName("com.labresource.backend.equipment.entity.Equipment");
                    Object eq = entityManager.find(eqClass, equipmentId);
                    if (eq != null) {
                        Method getDeptId = eq.getClass().getMethod("getDepartmentId");
                        Long deptId = (Long) getDeptId.invoke(eq);
                        if (deptId != null && !deptId.equals(principal.getDepartmentId())) {
                            return false;
                        }
                    }
                }
            } catch (Exception ignored) {}
        }

        try {
            // Get department_id if present in target class
            Method getDeptId = target.getClass().getMethod("getDepartmentId");
            Long deptId = (Long) getDeptId.invoke(target);
            if (deptId != null && !deptId.equals(principal.getDepartmentId())) {
                return false;
            }
        } catch (Exception ignored) {}

        try {
            // Get institution_id if present in target class
            Method getInstId = target.getClass().getMethod("getInstitutionId");
            Long instId = (Long) getInstId.invoke(target);
            if (instId != null && !instId.equals(principal.getInstitutionId())) {
                return false;
            }
        } catch (Exception ignored) {}

        return true;
    }

    private String getPackageNameForType(String type) {
        return switch (type) {
            case "Booking" -> "booking";
            case "Equipment" -> "equipment";
            case "EquipmentIssueReport" -> "issuereport";
            case "MaintenanceRequest" -> "maintenance";
            case "SharingAgreement" -> "sharing";
            default -> type.toLowerCase();
        };
    }
}
