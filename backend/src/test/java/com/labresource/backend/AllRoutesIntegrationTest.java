package com.labresource.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labresource.backend.auth.dto.LoginRequest;
import com.labresource.backend.auth.dto.RegisterRequest;
import com.labresource.backend.auth.entity.AppUser;
import com.labresource.backend.auth.repository.AppUserRepository;
import com.labresource.backend.department.entity.Department;
import com.labresource.backend.department.repository.DepartmentRepository;
import com.labresource.backend.equipment.entity.Equipment;
import com.labresource.backend.equipment.repository.EquipmentRepository;
import com.labresource.backend.institution.entity.Institution;
import com.labresource.backend.institution.repository.InstitutionRepository;
import com.labresource.backend.otp.entity.OtpVerification;
import com.labresource.backend.otp.repository.OtpVerificationRepository;
import com.labresource.backend.security.CustomUserDetailsService;
import com.labresource.backend.security.JwtTokenProvider;
import com.labresource.backend.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AllRoutesIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private InstitutionRepository institutionRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private OtpVerificationRepository otpVerificationRepository;

    private String getBearerToken(String email) {
        UserPrincipal principal = (UserPrincipal) userDetailsService.loadUserByUsername(email);
        return "Bearer " + jwtTokenProvider.generateToken(principal);
    }

    private Long getUserIdByEmail(String email) {
        return appUserRepository.findByEmail(email).map(AppUser::getUserId).orElse(null);
    }

    @Test
    @DisplayName("Route Test: Auth Controller - Login and Register")
    void testAuthRoutes() throws Exception {
        Institution inst = institutionRepository.findAll().stream().findFirst().orElseThrow();
        Department dept = departmentRepository.findAll().stream().findFirst().orElseThrow();

        // 1. Test Login
        LoginRequest loginDto = new LoginRequest();
        loginDto.setEmail("researcher@labresource.com");
        loginDto.setPassword("Password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.user.email").value("researcher@labresource.com"));

        // 2. Seed verified OTP for registration
        String newEmail = "newuser" + System.currentTimeMillis() + "@labresource.com";
        OtpVerification otp = new OtpVerification();
        otp.setIdentifier(newEmail.toLowerCase());
        otp.setIdentifierType("EMAIL");
        otp.setPurpose("REGISTRATION");
        otp.setOtpHash("dummy_hash");
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        otp.setVerifiedAt(LocalDateTime.now());
        otpVerificationRepository.save(otp);

        // 3. Test Register
        RegisterRequest regDto = new RegisterRequest();
        regDto.setEmail(newEmail);
        regDto.setPassword("StrongPass123!");
        regDto.setConfirmPassword("StrongPass123!");
        regDto.setFirstName("John");
        regDto.setLastName("Doe");
        regDto.setInstitutionId(inst.getInstitutionId());
        regDto.setDepartmentId(dept.getDepartmentId());
        regDto.setRole("RESEARCHER");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(newEmail));
    }

    @Test
    @DisplayName("Route Test: Profile Controller")
    void testProfileRoutes() throws Exception {
        String token = getBearerToken("researcher@labresource.com");
        mockMvc.perform(get("/api/profile")
                        .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value("researcher@labresource.com"));
    }

    @Test
    @DisplayName("Route Test: Institution Controller")
    void testInstitutionRoutes() throws Exception {
        Institution inst = institutionRepository.findAll().stream().findFirst().orElseThrow();

        mockMvc.perform(get("/api/institutions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));

        mockMvc.perform(get("/api/institutions/" + inst.getInstitutionId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.institutionId").value(inst.getInstitutionId()));

        mockMvc.perform(get("/api/institutions/" + inst.getInstitutionId() + "/departments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));
    }

    @Test
    @DisplayName("Route Test: Department Controller")
    void testDepartmentRoutes() throws Exception {
        String adminToken = getBearerToken("systemadmin@labresource.com");
        String researcherToken = getBearerToken("researcher@labresource.com");
        Department dept = departmentRepository.findAll().stream().findFirst().orElseThrow();

        mockMvc.perform(get("/api/departments")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));

        mockMvc.perform(get("/api/departments/" + dept.getDepartmentId())
                        .header("Authorization", researcherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.departmentId").value(dept.getDepartmentId()));
    }

    @Test
    @DisplayName("Route Test: Equipment Controller")
    void testEquipmentRoutes() throws Exception {
        String token = getBearerToken("researcher@labresource.com");
        Equipment eq = equipmentRepository.findAll().stream().findFirst().orElseThrow();

        mockMvc.perform(get("/api/equipment")
                        .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))));

        mockMvc.perform(get("/api/equipment/" + eq.getEquipmentId())
                        .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.equipmentId").value(eq.getEquipmentId()));
    }

    @Test
    @DisplayName("Route Test: Tags Controller")
    void testTagRoutes() throws Exception {
        String token = getBearerToken("researcher@labresource.com");
        mockMvc.perform(get("/api/tags")
                        .header("Authorization", token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Route Test: Booking Controller & Test Routes")
    void testBookingRoutes() throws Exception {
        String researcherToken = getBearerToken("researcher@labresource.com");
        String labManagerToken = getBearerToken("labmanager@labresource.com");

        mockMvc.perform(get("/api/bookings/my")
                        .header("Authorization", researcherToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/bookings/approvals")
                        .header("Authorization", labManagerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/bookings/test/researcher-to-lab-manager")
                        .header("Authorization", researcherToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Route Test: Waitlist Controller")
    void testWaitlistRoutes() throws Exception {
        String token = getBearerToken("researcher@labresource.com");
        mockMvc.perform(get("/api/waitlists/my")
                        .header("Authorization", token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Route Test: Notification Controller")
    void testNotificationRoutes() throws Exception {
        String token = getBearerToken("researcher@labresource.com");

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").exists());

        mockMvc.perform(put("/api/notifications/read-all")
                        .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    @DisplayName("Route Test: Issue Reports Controller")
    void testIssueReportRoutes() throws Exception {
        String researcherToken = getBearerToken("researcher@labresource.com");
        String labManagerToken = getBearerToken("labmanager@labresource.com");

        mockMvc.perform(get("/api/issue-reports/my")
                        .header("Authorization", researcherToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/issue-reports/eligible-bookings")
                        .header("Authorization", researcherToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/issue-reports")
                        .header("Authorization", labManagerToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Route Test: Sharing Controller")
    void testSharingRoutes() throws Exception {
        String researcherToken = getBearerToken("researcher@labresource.com");
        String labManagerToken = getBearerToken("labmanager@labresource.com");
        Equipment eq = equipmentRepository.findAll().stream().findFirst().orElseThrow();

        mockMvc.perform(get("/api/sharing/requests/incoming")
                        .header("Authorization", labManagerToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/sharing/requests/outgoing")
                        .header("Authorization", researcherToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/sharing/agreements")
                        .header("Authorization", researcherToken)
                        .param("equipmentId", String.valueOf(eq.getEquipmentId())))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Route Test: Utilization Controller")
    void testUtilizationRoutes() throws Exception {
        String labManagerToken = getBearerToken("labmanager@labresource.com");
        Department dept = departmentRepository.findAll().stream().findFirst().orElseThrow();

        mockMvc.perform(get("/api/utilization/department/" + dept.getDepartmentId())
                        .header("Authorization", labManagerToken)
                        .param("period", "weekly"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/utilization/heatmap")
                        .header("Authorization", labManagerToken)
                        .param("scope", "department")
                        .param("id", String.valueOf(dept.getDepartmentId())))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Route Test: Report Controller")
    void testReportRoutes() throws Exception {
        String labManagerToken = getBearerToken("labmanager@labresource.com");
        mockMvc.perform(get("/api/reports")
                        .header("Authorization", labManagerToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Route Test: User Management Controller")
    void testUserManagementRoutes() throws Exception {
        String systemAdminToken = getBearerToken("systemadmin@labresource.com");
        Long instAdminUserId = getUserIdByEmail("institutionadmin@labresource.com");

        mockMvc.perform(post("/api/users/verify-institution-admin/" + instAdminUserId)
                        .header("Authorization", systemAdminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());
    }
}
