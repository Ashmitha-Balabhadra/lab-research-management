package com.labresource.backend.issuereport.service;

import com.labresource.backend.booking.entity.Booking;
import com.labresource.backend.booking.repository.BookingRepository;
import com.labresource.backend.common.exception.ApiException;
import com.labresource.backend.equipment.entity.Equipment;
import com.labresource.backend.equipment.repository.EquipmentRepository;
import com.labresource.backend.issuereport.dto.EligibleBookingDto;
import com.labresource.backend.issuereport.dto.IssueReportRequestDto;
import com.labresource.backend.issuereport.entity.EquipmentIssueReport;
import com.labresource.backend.issuereport.repository.EquipmentIssueReportRepository;
import com.labresource.backend.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EquipmentIssueReportService {

    private final EquipmentIssueReportRepository issueReportRepository;
    private final BookingRepository bookingRepository;
    private final EquipmentRepository equipmentRepository;
    private final NotificationService notificationService;

    public List<EligibleBookingDto> getEligibleBookings(Long userId) {
        List<Booking> bookings = bookingRepository.findAll().stream()
                .filter(b -> b.getUserId().equals(userId) &&
                        (Booking.IN_USE.equals(b.getStatus()) || Booking.COMPLETED.equals(b.getStatus())))
                .toList();

        return bookings.stream().map(b -> {
            Equipment eq = equipmentRepository.findById(b.getEquipmentId()).orElse(null);
            String eqName = eq != null ? eq.getName() : "Unknown Equipment";
            String category = eq != null ? eq.getCategory() : "";
            String location = eq != null ? eq.getLocation() : "";

            return new EligibleBookingDto(
                    b.getBookingId(),
                    b.getEquipmentId(),
                    eqName,
                    category,
                    location,
                    b.getStartTime(),
                    b.getEndTime()
            );
        }).toList();
    }

    @Transactional
    public EquipmentIssueReport reportIssue(Long userId, IssueReportRequestDto dto) {
        Booking booking = bookingRepository.findById(dto.getBookingId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Booking not found."));

        if (!booking.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This booking does not belong to you.");
        }

        if (!Booking.IN_USE.equals(booking.getStatus()) && !Booking.COMPLETED.equals(booking.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Issues can only be reported for active or completed bookings.");
        }

        Equipment equipment = equipmentRepository.findById(booking.getEquipmentId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Equipment not found."));

        // Transition equipment status to UNDER_MAINTENANCE
        equipment.setStatus(Equipment.UNDER_MAINTENANCE);
        equipmentRepository.save(equipment);

        EquipmentIssueReport report = new EquipmentIssueReport();
        report.setEquipmentId(equipment.getEquipmentId());
        report.setBookingId(booking.getBookingId());
        report.setReportedBy(userId);
        report.setIssueType(dto.getIssueType());
        report.setIssueDescription(dto.getDescription());
        report.setPriority(dto.getPriority().toUpperCase());
        report.setAttachmentSecureUrl(dto.getAttachmentUrl());
        report.setStatus("OPEN");

        EquipmentIssueReport saved = issueReportRepository.save(report);

        // Notify managers
        notificationService.notifyDepartmentLabManagers(
                equipment.getDepartmentId(),
                "EQUIPMENT_ISSUE_REPORTED",
                "New issue reported: " + equipment.getName(),
                "A new issue was reported for \"" + equipment.getName() + "\" by user ID: " + userId
        );

        return saved;
    }

    public List<EquipmentIssueReport> myReports(Long userId) {
        return issueReportRepository.findByReportedByOrderByCreatedAtDesc(userId);
    }

    public List<EquipmentIssueReport> getDepartmentIssues(Long departmentId, String status) {
        if (status == null || status.isBlank()) {
            return issueReportRepository.findByDepartmentIdOrderByCreatedAtDesc(departmentId);
        }
        return issueReportRepository.findByDepartmentIdAndStatusOrderByCreatedAtDesc(departmentId, status.toUpperCase());
    }

    @Transactional
    public EquipmentIssueReport assignTechnician(Long issueId, Long technicianId) {
        EquipmentIssueReport report = issueReportRepository.findById(issueId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Issue report not found."));

        report.setStatus("ASSIGNED");
        report.setAssignedTechnicianId(technicianId);
        return issueReportRepository.save(report);
    }

    @Transactional
    public EquipmentIssueReport resolveIssue(Long issueId) {
        EquipmentIssueReport report = issueReportRepository.findById(issueId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Issue report not found."));

        report.setStatus("RESOLVED");
        report.setResolvedAt(LocalDateTime.now());
        EquipmentIssueReport saved = issueReportRepository.save(report);

        // Restore equipment status back to AVAILABLE
        equipmentRepository.findById(report.getEquipmentId()).ifPresent(eq -> {
            eq.setStatus(Equipment.AVAILABLE);
            equipmentRepository.save(eq);
        });

        // Notify reporter
        notificationService.notifyUser(report.getReportedBy(), "ISSUE_RESOLVED", "Issue Resolved",
                "Your reported issue for equipment has been resolved.");

        return saved;
    }
}
