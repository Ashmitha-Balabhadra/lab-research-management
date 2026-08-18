package com.labresource.backend.config;

import com.labresource.backend.auth.entity.AppUser;
import com.labresource.backend.auth.repository.AppUserRepository;
import com.labresource.backend.department.entity.Department;
import com.labresource.backend.department.repository.DepartmentRepository;
import com.labresource.backend.institution.entity.Institution;
import com.labresource.backend.institution.repository.InstitutionRepository;
import com.labresource.backend.role.entity.Role;
import com.labresource.backend.role.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final InstitutionRepository institutionRepository;
    private final DepartmentRepository departmentRepository;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking database data initialization status...");

        // 1. Seed Roles
        List<String> roleNames = List.of(
                Role.SYSTEM_ADMIN,
                Role.INSTITUTION_ADMIN,
                Role.DEPARTMENT_HEAD,
                Role.LAB_MANAGER,
                Role.LAB_TECHNICIAN,
                Role.RESEARCHER
        );

        for (String rName : roleNames) {
            if (roleRepository.findByRoleName(rName).isEmpty()) {
                Role r = new Role();
                r.setRoleName(rName);
                roleRepository.save(r);
                log.info("Seeded Role: {}", rName);
            }
        }

        // 2. Seed Default Institution if empty
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

            // 3. Seed Default Department
            Department dept = new Department();
            dept.setInstitutionId(savedInst.getInstitutionId());
            dept.setName("Default Research Lab Department");
            dept.setBudgetAllocated(BigDecimal.valueOf(1000000.00));
            dept.setIsActive(true);
            Department savedDept = departmentRepository.save(dept);
            log.info("Seeded Default Department with ID: {}", savedDept.getDepartmentId());
        }

        // 4. Seed default accounts for all roles if none exists
        Institution defaultInst = institutionRepository.findAll().get(0);
        Department defaultDept = departmentRepository.findAll().get(0);

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
                        newUser.setPasswordHash(passwordEncoder.encode("Password123")); // Default password
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

        log.info("Data initialization check completed successfully.");
    }

    private record UserData(String email, String firstName, String lastName, String role) {}
}
