package com.labresource.backend.config;

import com.labresource.backend.auth.entity.AppUser;
import com.labresource.backend.auth.repository.AppUserRepository;
import com.labresource.backend.department.entity.Department;
import com.labresource.backend.department.repository.DepartmentRepository;
import com.labresource.backend.equipment.entity.Equipment;
import com.labresource.backend.equipment.repository.EquipmentRepository;
import com.labresource.backend.institution.entity.Institution;
import com.labresource.backend.institution.repository.InstitutionRepository;
import com.labresource.backend.permission.entity.Permission;
import com.labresource.backend.permission.repository.PermissionRepository;
import com.labresource.backend.role.entity.Role;
import com.labresource.backend.role.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final InstitutionRepository institutionRepository;
    private final DepartmentRepository departmentRepository;
    private final EquipmentRepository equipmentRepository;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Checking database data initialization status...");

        // 1. Seed Permissions
        Map<String, String> permissionsMap = new LinkedHashMap<>();
        permissionsMap.put("VIEW_EQUIPMENT", "View laboratory equipment and availability");
        permissionsMap.put("MANAGE_EQUIPMENT", "Add, update and manage laboratory equipment");
        permissionsMap.put("REPORT_EQUIPMENT_ISSUE", "Report an issue with booked laboratory equipment");
        permissionsMap.put("VIEW_EQUIPMENT_DOCUMENTS", "View equipment manuals, datasheets and documents");
        permissionsMap.put("MANAGE_EQUIPMENT_DOCUMENTS", "Upload and manage equipment documents");
        permissionsMap.put("BOOK_EQUIPMENT", "Book laboratory equipment");
        permissionsMap.put("CANCEL_BOOKING", "Cancel own equipment booking");
        permissionsMap.put("RESCHEDULE_BOOKING", "Reschedule own equipment booking");
        permissionsMap.put("APPROVE_BOOKING", "Approve equipment booking");
        permissionsMap.put("REJECT_BOOKING", "Reject equipment booking");
        permissionsMap.put("JOIN_WAITLIST", "Join equipment waitlist");
        permissionsMap.put("VIEW_BOOKING_HISTORY", "View equipment booking history");
        permissionsMap.put("MANAGE_RECURRING_BOOKING", "Create and manage recurring equipment bookings");
        permissionsMap.put("VIEW_MAINTENANCE", "View maintenance requests");
        permissionsMap.put("CREATE_MAINTENANCE_REQUEST", "Create maintenance request");
        permissionsMap.put("ASSIGN_MAINTENANCE", "Assign maintenance work");
        permissionsMap.put("UPDATE_MAINTENANCE", "Update maintenance work status");
        permissionsMap.put("COMPLETE_MAINTENANCE", "Complete assigned maintenance work");
        permissionsMap.put("MANAGE_CALIBRATION", "Manage equipment calibration");
        permissionsMap.put("VIEW_EQUIPMENT_ISSUES", "View equipment issue reports");
        permissionsMap.put("ASSIGN_EQUIPMENT_ISSUE", "Assign reported equipment issues");
        permissionsMap.put("RESOLVE_EQUIPMENT_ISSUE", "Resolve equipment issues");
        permissionsMap.put("MANAGE_TECHNICIAN_AVAILABILITY", "Manage technician availability");
        permissionsMap.put("VIEW_TECHNICIAN_AVAILABILITY", "View technician availability");
        permissionsMap.put("VIEW_TECHNICIAN_WORKLOAD", "View technician workload");
        permissionsMap.put("VIEW_UTILIZATION", "View equipment utilization");
        permissionsMap.put("VIEW_UTILIZATION_ANALYTICS", "View utilization analytics");
        permissionsMap.put("VIEW_USAGE_PATTERNS", "View usage patterns");
        permissionsMap.put("VIEW_SHARED_EQUIPMENT", "View equipment for sharing");
        permissionsMap.put("REQUEST_RESOURCE_SHARING", "Request access to equipment from another institution");
        permissionsMap.put("APPROVE_SHARING_REQUEST", "Approve sharing requests");
        permissionsMap.put("REJECT_SHARING_REQUEST", "Reject sharing requests");
        permissionsMap.put("MANAGE_SHARING_AGREEMENT", "Manage sharing agreements");
        permissionsMap.put("MANAGE_SHARED_EQUIPMENT_ACCESS", "Manage shared equipment access");
        permissionsMap.put("MANAGE_SHARED_BOOKING", "Manage shared bookings");
        permissionsMap.put("VIEW_SHARING_ANALYTICS", "View sharing analytics");
        permissionsMap.put("VIEW_COST", "View costs");
        permissionsMap.put("MANAGE_COST_ALLOCATION", "Manage cost allocation");
        permissionsMap.put("MANAGE_USAGE_CHARGES", "Manage usage charges");
        permissionsMap.put("MANAGE_BILLING", "Manage billing");
        permissionsMap.put("MANAGE_BUDGET", "Manage budget");
        permissionsMap.put("GENERATE_INVOICE", "Generate invoice");
        permissionsMap.put("VIEW_FINANCIAL_REPORT", "View financial reports");
        permissionsMap.put("GENERATE_REPORT", "Generate reports");
        permissionsMap.put("VIEW_REPORT", "View reports");
        permissionsMap.put("EXPORT_REPORT_PDF", "Export report as PDF");
        permissionsMap.put("EXPORT_REPORT_EXCEL", "Export report as Excel");
        permissionsMap.put("CREATE_USER", "Create or invite users");
        permissionsMap.put("UPDATE_USER", "Update user");
        permissionsMap.put("DEACTIVATE_USER", "Deactivate user");
        permissionsMap.put("CREATE_DEPARTMENT", "Create department");
        permissionsMap.put("UPDATE_DEPARTMENT", "Update department");
        permissionsMap.put("DEACTIVATE_DEPARTMENT", "Deactivate department");
        permissionsMap.put("MANAGE_INSTITUTION", "Manage institution");
        permissionsMap.put("MANAGE_NOTIFICATIONS", "Manage notifications");
        permissionsMap.put("MANAGE_ROLES", "Manage roles");
        permissionsMap.put("MANAGE_PERMISSIONS", "Manage permissions");
        permissionsMap.put("VIEW_AUDIT_LOG", "View audit log");

        Map<String, Permission> permissionEntityMap = new HashMap<>();
        for (Map.Entry<String, String> entry : permissionsMap.entrySet()) {
            Permission p = permissionRepository.findByPermissionName(entry.getKey()).orElseGet(() -> {
                Permission newP = new Permission();
                newP.setPermissionName(entry.getKey());
                newP.setDescription(entry.getValue());
                return permissionRepository.save(newP);
            });
            permissionEntityMap.put(entry.getKey(), p);
        }

        // 2. Seed Roles & Link Permissions
        Map<String, List<String>> rolePermissionMappings = new HashMap<>();
        rolePermissionMappings.put(Role.RESEARCHER, List.of(
                "VIEW_EQUIPMENT", "VIEW_EQUIPMENT_DOCUMENTS", "BOOK_EQUIPMENT", "CANCEL_BOOKING",
                "RESCHEDULE_BOOKING", "JOIN_WAITLIST", "VIEW_BOOKING_HISTORY", "REPORT_EQUIPMENT_ISSUE",
                "VIEW_MAINTENANCE", "CREATE_MAINTENANCE_REQUEST", "VIEW_SHARED_EQUIPMENT", "REQUEST_RESOURCE_SHARING"
        ));

        rolePermissionMappings.put(Role.LAB_TECHNICIAN, List.of(
                "VIEW_EQUIPMENT", "VIEW_EQUIPMENT_DOCUMENTS", "VIEW_MAINTENANCE", "UPDATE_MAINTENANCE",
                "COMPLETE_MAINTENANCE", "MANAGE_CALIBRATION", "VIEW_EQUIPMENT_ISSUES", "ASSIGN_EQUIPMENT_ISSUE",
                "RESOLVE_EQUIPMENT_ISSUE", "VIEW_TECHNICIAN_AVAILABILITY", "VIEW_TECHNICIAN_WORKLOAD", "VIEW_SHARED_EQUIPMENT"
        ));

        rolePermissionMappings.put(Role.LAB_MANAGER, List.of(
                "VIEW_EQUIPMENT", "MANAGE_EQUIPMENT", "VIEW_EQUIPMENT_DOCUMENTS", "MANAGE_EQUIPMENT_DOCUMENTS",
                "BOOK_EQUIPMENT", "CANCEL_BOOKING", "RESCHEDULE_BOOKING", "APPROVE_BOOKING", "REJECT_BOOKING",
                "MANAGE_RECURRING_BOOKING", "VIEW_BOOKING_HISTORY", "VIEW_MAINTENANCE", "CREATE_MAINTENANCE_REQUEST",
                "ASSIGN_MAINTENANCE", "UPDATE_MAINTENANCE", "COMPLETE_MAINTENANCE", "MANAGE_CALIBRATION",
                "VIEW_EQUIPMENT_ISSUES", "ASSIGN_EQUIPMENT_ISSUE", "RESOLVE_EQUIPMENT_ISSUE", "VIEW_TECHNICIAN_AVAILABILITY",
                "VIEW_TECHNICIAN_WORKLOAD", "MANAGE_TECHNICIAN_AVAILABILITY", "VIEW_UTILIZATION", "VIEW_UTILIZATION_ANALYTICS",
                "VIEW_USAGE_PATTERNS", "VIEW_SHARED_EQUIPMENT", "REQUEST_RESOURCE_SHARING", "APPROVE_SHARING_REQUEST",
                "REJECT_SHARING_REQUEST", "MANAGE_SHARING_AGREEMENT", "MANAGE_SHARED_EQUIPMENT_ACCESS", "MANAGE_SHARED_BOOKING",
                "VIEW_SHARING_ANALYTICS", "VIEW_COST", "GENERATE_REPORT", "VIEW_REPORT"
        ));

        rolePermissionMappings.put(Role.DEPARTMENT_HEAD, List.of(
                "VIEW_EQUIPMENT", "VIEW_EQUIPMENT_DOCUMENTS", "APPROVE_BOOKING", "REJECT_BOOKING",
                "VIEW_MAINTENANCE", "VIEW_EQUIPMENT_ISSUES", "VIEW_UTILIZATION", "VIEW_UTILIZATION_ANALYTICS",
                "VIEW_USAGE_PATTERNS", "VIEW_SHARED_EQUIPMENT", "REQUEST_RESOURCE_SHARING", "APPROVE_SHARING_REQUEST",
                "REJECT_SHARING_REQUEST", "MANAGE_SHARING_AGREEMENT", "MANAGE_SHARED_EQUIPMENT_ACCESS",
                "VIEW_SHARING_ANALYTICS", "VIEW_COST", "MANAGE_COST_ALLOCATION", "MANAGE_BUDGET", "VIEW_FINANCIAL_REPORT",
                "GENERATE_REPORT", "VIEW_REPORT", "EXPORT_REPORT_PDF", "EXPORT_REPORT_EXCEL"
        ));

        rolePermissionMappings.put(Role.INSTITUTION_ADMIN, new ArrayList<>(permissionsMap.keySet()));
        rolePermissionMappings.put(Role.SYSTEM_ADMIN, new ArrayList<>(permissionsMap.keySet()));

        for (Map.Entry<String, List<String>> entry : rolePermissionMappings.entrySet()) {
            String rName = entry.getKey();
            Role r = roleRepository.findByRoleName(rName).orElseGet(() -> {
                Role newRole = new Role();
                newRole.setRoleName(rName);
                return roleRepository.save(newRole);
            });

            Set<Permission> perms = new HashSet<>();
            for (String pName : entry.getValue()) {
                Permission perm = permissionEntityMap.get(pName);
                if (perm != null) perms.add(perm);
            }
            r.setPermissions(perms);
            roleRepository.save(r);
        }

        // 3. Seed Default Institution if empty
        if (institutionRepository.count() == 0) {
            Institution inst = new Institution();
            inst.setName("Default Testing Institution");
            inst.setAddress("123 Science Way");
            inst.setCity("Mumbai");
            inst.setState("Maharashtra");
            inst.setCountry("India");
            inst.setContactEmail("info@defaultinst.edu");
            inst.setIsActive(true);
            Institution savedInst = institutionRepository.save(inst);
            log.info("Seeded Default Institution with ID: {}", savedInst.getInstitutionId());

            // 4. Seed Default Department
            Department dept = new Department();
            dept.setInstitutionId(savedInst.getInstitutionId());
            dept.setName("Default Research Lab Department");
            dept.setBudgetAllocated(BigDecimal.valueOf(1000000.00));
            dept.setIsActive(true);
            Department savedDept = departmentRepository.save(dept);
            log.info("Seeded Default Department with ID: {}", savedDept.getDepartmentId());
        }

        Institution defaultInst = institutionRepository.findAll().get(0);
        Department defaultDept = departmentRepository.findAll().get(0);

        // 5. Seed default accounts for all roles if none exists
        List<UserData> defaultUsers = List.of(
                new UserData("systemadmin@labresource.com", "System", "Admin", Role.SYSTEM_ADMIN),
                new UserData("institutionadmin@labresource.com", "Institution", "Admin", Role.INSTITUTION_ADMIN),
                new UserData("depthead@labresource.com", "Department", "Head", Role.DEPARTMENT_HEAD),
                new UserData("labmanager@labresource.com", "Lab", "Manager", Role.LAB_MANAGER),
                new UserData("labtech@labresource.com", "Lab", "Technician", Role.LAB_TECHNICIAN),
                new UserData("researcher@labresource.com", "Alice", "Researcher", Role.RESEARCHER)
        );

        for (UserData u : defaultUsers) {
            appUserRepository.findByEmail(u.email).ifPresentOrElse(
                user -> {
                    if (Boolean.FALSE.equals(user.getIsActive()) || Boolean.FALSE.equals(user.getIsEmailVerified())) {
                        user.setIsActive(true);
                        user.setIsEmailVerified(true);
                        appUserRepository.save(user);
                        log.info("Activated existing account ({})", u.email);
                    }
                },
                () -> {
                    roleRepository.findByRoleName(u.role).ifPresent(role -> {
                        AppUser newUser = new AppUser();
                        newUser.setFirstName(u.firstName);
                        newUser.setLastName(u.lastName);
                        newUser.setEmail(u.email);
                        newUser.setPasswordHash(passwordEncoder.encode("Password123"));
                        newUser.setAuthProvider("LOCAL");
                        newUser.setInstitutionId(defaultInst.getInstitutionId());
                        newUser.setDepartmentId(defaultDept.getDepartmentId());
                        newUser.setIsActive(true);
                        newUser.setIsEmailVerified(true);
                        newUser.setIsInvitationAccepted(true);
                        newUser.setIsPhoneVerified(true);
                        newUser.setRoles(new HashSet<>() {{ add(role); }});

                        appUserRepository.save(newUser);
                        log.info("Seeded Account for Role {}: {} / Password123", u.role, u.email);
                    });
                }
            );
        }

        // 6. Seed Default Equipment if empty
        if (equipmentRepository.count() == 0) {
            Equipment eq = new Equipment();
            eq.setName("Bruker 400MHz NMR Spectrometer");
            eq.setCategory("Spectroscopy");
            eq.setManufacturer("Bruker");
            eq.setModel("AVANCE 400");
            eq.setSerialNumber("NMR-400-001");
            eq.setLocation("Room 101, Main Science Building");
            eq.setStatus(Equipment.AVAILABLE);
            eq.setCapacityPerSlot(1);
            eq.setIsShareable(true);
            eq.setDepartmentId(defaultDept.getDepartmentId());
            eq.setInstitutionId(defaultInst.getInstitutionId());
            eq.setSpecifications("High-resolution NMR spectrometer for structural analysis.");
            eq.setCalibrationRequired(false);
            equipmentRepository.save(eq);
            log.info("Seeded default equipment: {}", eq.getName());
        }

        log.info("Data initialization check completed successfully.");
    }

    private record UserData(String email, String firstName, String lastName, String role) {}
}
