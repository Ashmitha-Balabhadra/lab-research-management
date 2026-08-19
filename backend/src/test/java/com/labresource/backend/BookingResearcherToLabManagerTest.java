package com.labresource.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labresource.backend.booking.dto.BookingRequestDto;
import com.labresource.backend.equipment.entity.Equipment;
import com.labresource.backend.equipment.repository.EquipmentRepository;
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

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class BookingResearcherToLabManagerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private EquipmentRepository equipmentRepository;

    private String researcherToken;
    private String labManagerToken;
    private Long equipmentId;

    @BeforeEach
    void setUp() {
        UserPrincipal researcherPrincipal = (UserPrincipal) userDetailsService.loadUserByUsername("researcher@labresource.com");
        UserPrincipal managerPrincipal = (UserPrincipal) userDetailsService.loadUserByUsername("labmanager@labresource.com");

        researcherToken = "Bearer " + jwtTokenProvider.generateToken(researcherPrincipal);
        labManagerToken = "Bearer " + jwtTokenProvider.generateToken(managerPrincipal);

        Equipment equipment = equipmentRepository.findAll().stream().findFirst().orElse(null);
        if (equipment != null) {
            equipmentId = equipment.getEquipmentId();
        }
    }

    @Test
    @DisplayName("Complete Flow: Researcher creates booking -> Test route / Lab Manager approvals -> Lab Manager approves")
    void testResearcherToLabManagerBookingFlow() throws Exception {
        // 1. Researcher submits a booking request
        LocalDateTime start = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = start.plusHours(2);

        BookingRequestDto bookingReq = new BookingRequestDto();
        bookingReq.setEquipmentId(equipmentId);
        bookingReq.setStartTime(start);
        bookingReq.setEndTime(end);
        bookingReq.setPurpose("High-resolution protein sample testing");
        bookingReq.setIsRecurring(false);

        String createResponse = mockMvc.perform(post("/api/bookings")
                        .header("Authorization", researcherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingId").exists())
                .andExpect(jsonPath("$.status").value("PENDING_APPROVAL"))
                .andExpect(jsonPath("$.equipmentName").exists())
                .andReturn().getResponse().getContentAsString();

        Long bookingId = objectMapper.readTree(createResponse).get("bookingId").asLong();

        // 2. Researcher views own bookings
        mockMvc.perform(get("/api/bookings/my")
                        .header("Authorization", researcherToken)
                        .param("tab", "upcoming"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[?(@.bookingId == " + bookingId + ")].status").value("PENDING_APPROVAL"));

        // 3. Test Route: Researcher-to-Lab-Manager overview route
        mockMvc.perform(get("/api/bookings/test/researcher-to-lab-manager")
                        .header("Authorization", researcherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[?(@.bookingId == " + bookingId + ")].researcherEmail").value("researcher@labresource.com"))
                .andExpect(jsonPath("$[?(@.bookingId == " + bookingId + ")].equipmentId").value(equipmentId.intValue()))
                .andExpect(jsonPath("$[?(@.bookingId == " + bookingId + ")].eligibleLabManagers").exists());

        // 4. Lab Manager views pending approvals
        mockMvc.perform(get("/api/bookings/approvals")
                        .header("Authorization", labManagerToken)
                        .param("status", "PENDING_APPROVAL"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[?(@.bookingId == " + bookingId + ")].status").value("PENDING_APPROVAL"));

        // 5. Lab Manager approves the booking
        mockMvc.perform(post("/api/bookings/" + bookingId + "/approve")
                        .header("Authorization", labManagerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingId").value(bookingId))
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        // 6. Test route shows status updated to CONFIRMED
        mockMvc.perform(get("/api/bookings/test/researcher-to-lab-manager")
                        .header("Authorization", researcherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.bookingId == " + bookingId + ")].status").value("CONFIRMED"));
    }

    @Test
    @DisplayName("Lab Manager rejects a booking request")
    void testLabManagerRejectBooking() throws Exception {
        LocalDateTime start = LocalDateTime.now().plusDays(5).withHour(14).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = start.plusHours(1);

        BookingRequestDto bookingReq = new BookingRequestDto();
        bookingReq.setEquipmentId(equipmentId);
        bookingReq.setStartTime(start);
        bookingReq.setEndTime(end);
        bookingReq.setPurpose("Spectroscopy calibration run");
        bookingReq.setIsRecurring(false);

        String createResponse = mockMvc.perform(post("/api/bookings")
                        .header("Authorization", researcherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long bookingId = objectMapper.readTree(createResponse).get("bookingId").asLong();

        // Lab Manager rejects with reason
        mockMvc.perform(post("/api/bookings/" + bookingId + "/reject")
                        .header("Authorization", labManagerToken)
                        .param("reason", "Equipment reserved for urgent maintenance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bookingId").value(bookingId))
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    @DisplayName("Researcher cancels own booking")
    void testResearcherCancelBooking() throws Exception {
        LocalDateTime start = LocalDateTime.now().plusDays(7).withHour(9).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime end = start.plusHours(2);

        BookingRequestDto bookingReq = new BookingRequestDto();
        bookingReq.setEquipmentId(equipmentId);
        bookingReq.setStartTime(start);
        bookingReq.setEndTime(end);
        bookingReq.setPurpose("Sample analysis");
        bookingReq.setIsRecurring(false);

        String createResponse = mockMvc.perform(post("/api/bookings")
                        .header("Authorization", researcherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bookingReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        Long bookingId = objectMapper.readTree(createResponse).get("bookingId").asLong();

        // Researcher cancels
        mockMvc.perform(put("/api/bookings/" + bookingId + "/cancel")
                        .header("Authorization", researcherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }
}
