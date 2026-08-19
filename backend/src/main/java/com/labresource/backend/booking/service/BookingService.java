package com.labresource.backend.booking.service;

import com.labresource.backend.auth.entity.AppUser;
import com.labresource.backend.auth.repository.AppUserRepository;
import com.labresource.backend.booking.dto.BookingDto;
import com.labresource.backend.booking.dto.BookingRequestDto;
import com.labresource.backend.booking.dto.ResearcherToLabManagerBookingDto;
import com.labresource.backend.booking.dto.RescheduleRequestDto;
import com.labresource.backend.booking.entity.Booking;
import com.labresource.backend.department.entity.Department;
import com.labresource.backend.department.repository.DepartmentRepository;
import com.labresource.backend.equipment.entity.Equipment;
import com.labresource.backend.equipment.repository.EquipmentRepository;
import com.labresource.backend.institution.entity.Institution;
import com.labresource.backend.institution.repository.InstitutionRepository;
import com.labresource.backend.maintenance.entity.MaintenanceRequest;
import com.labresource.backend.common.exception.ApiException;
import com.labresource.backend.booking.repository.BookingRepository;
import com.labresource.backend.maintenance.repository.MaintenanceRequestRepository;
import com.labresource.backend.equipment.service.EquipmentService;
import com.labresource.backend.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final MaintenanceRequestRepository maintenanceRequestRepository;
    private final EquipmentService equipmentService;
    private final EquipmentRepository equipmentRepository;
    private final AppUserRepository appUserRepository;
    private final DepartmentRepository departmentRepository;
    private final InstitutionRepository institutionRepository;
    private final NotificationService notificationService;
    private final com.labresource.backend.waitlist.service.WaitlistService waitlistService;
    private final com.labresource.backend.sharing.service.SharingService sharingService;
    private final com.labresource.backend.sharing.repository.SharedBookingRepository sharedBookingRepository;

    private static final List<String> UPCOMING_STATUSES = List.of(Booking.PENDING_APPROVAL, Booking.CONFIRMED);
    private static final List<String> ACTIVE_STATUSES = List.of(Booking.IN_USE);
    private static final List<String> HISTORY_STATUSES = List.of(Booking.COMPLETED, Booking.CANCELLED, Booking.NO_SHOW);

    @Transactional
    public BookingDto createBooking(Long userId, Long institutionId, BookingRequestDto request) {
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "End time must be after start time.");
        }

        Equipment equipment = equipmentService.getEntity(request.getEquipmentId());

        // Check 1: equipment must be AVAILABLE
        if (!Equipment.AVAILABLE.equals(equipment.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "This equipment is not currently available for booking.");
        }

        // Check 2: no overlapping bookings
        List<Booking> overlaps = bookingRepository.findOverlapping(
                equipment.getEquipmentId(), request.getStartTime(), request.getEndTime(), null);
        if (!overlaps.isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "This time slot conflicts with an existing booking. Please choose another time or join the waitlist.");
        }

        // Check 3: valid (non-expired) calibration must exist
        if (!equipmentService.hasValidCalibration(equipment.getEquipmentId())) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "This equipment does not have a valid calibration on record and cannot be booked right now.");
        }

        // Check 4: no active (non-completed/cancelled) maintenance request
        boolean hasActiveMaintenance = maintenanceRequestRepository
                .findByEquipmentIdAndStatusNot(equipment.getEquipmentId(), MaintenanceRequest.COMPLETED)
                .stream()
                .anyMatch(m -> !MaintenanceRequest.CANCELLED.equals(m.getStatus()));
        if (hasActiveMaintenance) {
            throw new ApiException(HttpStatus.CONFLICT, "This equipment has an open maintenance request and cannot be booked right now.");
        }

        // Check 5: Inter-institution sharing validation
        if (!equipment.getInstitutionId().equals(institutionId)) {
            List<com.labresource.backend.sharing.entity.SharingAgreement> agreements = sharingService.getActiveAgreements(
                    equipment.getEquipmentId(), request.getStartTime().toLocalDate());

            com.labresource.backend.sharing.entity.SharingAgreement activeAgreement = agreements.stream()
                    .filter(a -> a.getRequestingInstitutionId().equals(institutionId))
                    .findFirst()
                    .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT,
                            "No active sharing agreement exists between your institution and the equipment's owning institution for these dates."));

            if (request.getEndTime().toLocalDate().isAfter(activeAgreement.getEndDate())) {
                throw new ApiException(HttpStatus.CONFLICT, "The requested booking window extends beyond the sharing agreement end date: " + activeAgreement.getEndDate());
            }
        }

        Booking booking = new Booking();
        booking.setEquipmentId(equipment.getEquipmentId());
        booking.setUserId(userId);
        booking.setInstitutionId(institutionId);
        booking.setDepartmentId(equipment.getDepartmentId());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setStatus(Booking.PENDING_APPROVAL);
        booking.setPurpose(request.getPurpose());
        booking.setIsRecurring(Boolean.TRUE.equals(request.getIsRecurring()));
        booking.setRecurrencePattern(request.getRecurrencePattern());

        Booking saved = bookingRepository.save(booking);

        if (!equipment.getInstitutionId().equals(institutionId)) {
            com.labresource.backend.sharing.entity.SharingAgreement activeAgreement = sharingService.getActiveAgreements(
                    equipment.getEquipmentId(), request.getStartTime().toLocalDate()).stream()
                    .filter(a -> a.getRequestingInstitutionId().equals(institutionId))
                    .findFirst().get();

            com.labresource.backend.sharing.entity.SharedBooking sharedBooking = new com.labresource.backend.sharing.entity.SharedBooking();
            sharedBooking.setAgreementId(activeAgreement.getAgreementId());
            sharedBooking.setBookingId(saved.getBookingId());
            sharedBooking.setExternalInstitutionId(institutionId);
            sharedBooking.setUsageFee(java.math.BigDecimal.ZERO);
            sharedBookingRepository.save(sharedBooking);
        }

        notificationService.notifyDepartmentLabManagers(
                equipment.getDepartmentId(),
                "BOOKING_REQUEST",
                "New booking request",
                "A new booking request for \"" + equipment.getName() + "\" is awaiting your approval.");

        return BookingDto.fromEntity(saved, equipment.getName());
    }

    public List<BookingDto> myBookings(Long userId, String tab) {
        List<String> statuses = switch (tab == null ? "upcoming" : tab.toLowerCase()) {
            case "active" -> ACTIVE_STATUSES;
            case "history" -> HISTORY_STATUSES;
            default -> UPCOMING_STATUSES;
        };

        List<Booking> bookings = "history".equalsIgnoreCase(tab)
                ? bookingRepository.findByUserIdAndStatusInOrderByStartTimeDesc(userId, statuses)
                : bookingRepository.findByUserIdAndStatusInOrderByStartTimeAsc(userId, statuses);

        return bookings.stream()
                .map(b -> BookingDto.fromEntity(b, equipmentService.getEntity(b.getEquipmentId()).getName()))
                .toList();
    }

    public List<ResearcherToLabManagerBookingDto> getApprovalsForLabManager(Long managerUserId, Long departmentId, boolean isSystemAdmin, String status) {
        List<Booking> bookings;
        if (isSystemAdmin) {
            bookings = (status != null && !status.isBlank())
                    ? bookingRepository.findAllByOrderByCreatedAtDesc().stream()
                        .filter(b -> status.equalsIgnoreCase(b.getStatus()))
                        .toList()
                    : bookingRepository.findAllByOrderByCreatedAtDesc();
        } else {
            List<Equipment> deptEquipments = equipmentRepository.search(null, null, departmentId, null, null);
            List<Long> eqIds = deptEquipments.stream().map(Equipment::getEquipmentId).toList();
            if (eqIds.isEmpty()) {
                return List.of();
            }
            bookings = (status != null && !status.isBlank())
                    ? bookingRepository.findByEquipmentIdInAndStatusOrderByStartTimeDesc(eqIds, status.toUpperCase())
                    : bookingRepository.findByEquipmentIdInOrderByStartTimeDesc(eqIds);
        }

        return bookings.stream()
                .map(this::mapToResearcherToLabManagerDto)
                .toList();
    }

    public List<ResearcherToLabManagerBookingDto> getAllResearcherToLabManagerBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToResearcherToLabManagerDto)
                .toList();
    }

    public ResearcherToLabManagerBookingDto mapToResearcherToLabManagerDto(Booking b) {
        Equipment eq = equipmentRepository.findById(b.getEquipmentId()).orElse(null);
        String eqName = eq != null ? eq.getName() : "Unknown Equipment";
        String eqModel = eq != null ? eq.getModel() : null;
        String eqLoc = eq != null ? eq.getLocation() : null;
        Long deptId = eq != null ? eq.getDepartmentId() : b.getDepartmentId();

        AppUser researcher = appUserRepository.findById(b.getUserId()).orElse(null);
        String researcherName = researcher != null ? (researcher.getFirstName() + " " + researcher.getLastName()) : "Unknown Researcher";
        String researcherEmail = researcher != null ? researcher.getEmail() : null;

        Department dept = deptId != null ? departmentRepository.findById(deptId).orElse(null) : null;
        String deptName = dept != null ? dept.getName() : null;

        Institution inst = b.getInstitutionId() != null ? institutionRepository.findById(b.getInstitutionId()).orElse(null) : null;
        String instName = inst != null ? inst.getName() : null;

        List<ResearcherToLabManagerBookingDto.LabManagerSummaryDto> managers = List.of();
        if (deptId != null) {
            List<AppUser> deptManagers = appUserRepository.findByRoleNameAndDepartmentId("LAB_MANAGER", deptId);
            managers = deptManagers.stream()
                    .map(m -> ResearcherToLabManagerBookingDto.LabManagerSummaryDto.builder()
                            .userId(m.getUserId())
                            .name(m.getFirstName() + " " + m.getLastName())
                            .email(m.getEmail())
                            .build())
                    .toList();
        }

        String approverName = null;
        if (b.getApprovedBy() != null) {
            AppUser approver = appUserRepository.findById(b.getApprovedBy()).orElse(null);
            if (approver != null) {
                approverName = approver.getFirstName() + " " + approver.getLastName();
            }
        }

        return ResearcherToLabManagerBookingDto.builder()
                .bookingId(b.getBookingId())
                .equipmentId(b.getEquipmentId())
                .equipmentName(eqName)
                .equipmentModel(eqModel)
                .equipmentLocation(eqLoc)
                .researcherId(b.getUserId())
                .researcherName(researcherName)
                .researcherEmail(researcherEmail)
                .departmentId(deptId)
                .departmentName(deptName)
                .institutionId(b.getInstitutionId())
                .institutionName(instName)
                .eligibleLabManagers(managers)
                .startTime(b.getStartTime())
                .endTime(b.getEndTime())
                .status(b.getStatus())
                .purpose(b.getPurpose())
                .isRecurring(b.getIsRecurring())
                .recurrencePattern(b.getRecurrencePattern())
                .approvedBy(b.getApprovedBy())
                .approvedByName(approverName)
                .createdAt(b.getCreatedAt())
                .build();
    }

    @Transactional
    public BookingDto cancelBooking(Long userId, Long bookingId) {
        Booking booking = getOwnedBooking(userId, bookingId);
        if (!UPCOMING_STATUSES.contains(booking.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Only upcoming bookings can be cancelled.");
        }
        booking.setStatus(Booking.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        // Promote next user on waitlist
        waitlistService.promoteNext(saved.getEquipmentId(), saved.getStartTime(), saved.getEndTime());

        return BookingDto.fromEntity(saved, equipmentService.getEntity(saved.getEquipmentId()).getName());
    }

    @Transactional
    public BookingDto rescheduleBooking(Long userId, Long bookingId, RescheduleRequestDto request) {
        Booking booking = getOwnedBooking(userId, bookingId);
        if (!UPCOMING_STATUSES.contains(booking.getStatus())) {
            throw new ApiException(HttpStatus.CONFLICT, "Only upcoming bookings can be rescheduled.");
        }
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "End time must be after start time.");
        }

        List<Booking> overlaps = bookingRepository.findOverlapping(
                booking.getEquipmentId(), request.getStartTime(), request.getEndTime(), booking.getBookingId());
        if (!overlaps.isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "This time slot conflicts with an existing booking.");
        }

        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setStatus(Booking.PENDING_APPROVAL);
        Booking saved = bookingRepository.save(booking);
        return BookingDto.fromEntity(saved, equipmentService.getEntity(saved.getEquipmentId()).getName());
    }

    @Transactional
    public BookingDto approveBooking(Long approverUserId, Long approverDeptId, boolean isSystemAdmin, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Booking not found."));

        Equipment equipment = equipmentService.getEntity(booking.getEquipmentId());

        // Validate department ownership (approver must match equipment department or be System Admin)
        if (!isSystemAdmin && !equipment.getDepartmentId().equals(approverDeptId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to approve bookings for this department.");
        }

        booking.setStatus(Booking.CONFIRMED);
        booking.setApprovedBy(approverUserId);
        Booking saved = bookingRepository.save(booking);

        notificationService.notifyUser(booking.getUserId(), "BOOKING_APPROVED", "Booking Confirmed",
                "Your booking request for \"" + equipment.getName() + "\" has been approved.");

        return BookingDto.fromEntity(saved, equipment.getName());
    }

    @Transactional
    public BookingDto rejectBooking(Long approverUserId, Long approverDeptId, boolean isSystemAdmin, Long bookingId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Booking not found."));

        Equipment equipment = equipmentService.getEntity(booking.getEquipmentId());

        if (!isSystemAdmin && !equipment.getDepartmentId().equals(approverDeptId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not authorized to reject bookings for this department.");
        }

        booking.setStatus(Booking.CANCELLED);
        booking.setApprovedBy(approverUserId);
        if (reason != null && !reason.isBlank()) {
            booking.setPurpose(booking.getPurpose() + " (Rejected reason: " + reason + ")");
        }
        Booking saved = bookingRepository.save(booking);

        notificationService.notifyUser(booking.getUserId(), "BOOKING_REJECTED", "Booking Rejected",
                "Your booking request for \"" + equipment.getName() + "\" has been rejected.");

        return BookingDto.fromEntity(saved, equipment.getName());
    }

    private Booking getOwnedBooking(Long userId, Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Booking not found."));
        if (!booking.getUserId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "This booking does not belong to you.");
        }
        return booking;
    }
}
