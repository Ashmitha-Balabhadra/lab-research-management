package com.labresource.backend.sharing.service;

import com.labresource.backend.common.exception.ApiException;
import com.labresource.backend.equipment.entity.Equipment;
import com.labresource.backend.equipment.repository.EquipmentRepository;
import com.labresource.backend.sharing.entity.ResourceSharingRequest;
import com.labresource.backend.sharing.entity.SharedBooking;
import com.labresource.backend.sharing.entity.SharingAgreement;
import com.labresource.backend.sharing.repository.ResourceSharingRequestRepository;
import com.labresource.backend.sharing.repository.SharedBookingRepository;
import com.labresource.backend.sharing.repository.SharingAgreementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SharingService {

    private final ResourceSharingRequestRepository requestRepository;
    private final SharingAgreementRepository agreementRepository;
    private final SharedBookingRepository sharedBookingRepository;
    private final EquipmentRepository equipmentRepository;

    @Transactional
    public ResourceSharingRequest submitRequest(Long requestingInstId, Long requestedByUserId, Long equipmentId,
                                                LocalDate start, LocalDate end, String purpose) {
        Equipment eq = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Equipment not found."));

        if (eq.getInstitutionId().equals(requestingInstId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot request inter-institution sharing for equipment owned by your own institution.");
        }

        ResourceSharingRequest request = new ResourceSharingRequest();
        request.setRequestingInstitutionId(requestingInstId);
        request.setOwningInstitutionId(eq.getInstitutionId());
        request.setEquipmentId(equipmentId);
        request.setRequestedBy(requestedByUserId);
        request.setRequestedStartDate(start);
        request.setRequestedEndDate(end);
        request.setPurpose(purpose);
        request.setStatus("PENDING");

        return requestRepository.save(request);
    }

    @Transactional
    public SharingAgreement approveRequest(Long approverUserId, Long requestId, String costSharingTerms) {
        ResourceSharingRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sharing request not found."));

        if (!"PENDING".equals(request.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Sharing request is already " + request.getStatus().toLowerCase());
        }

        request.setStatus("APPROVED");
        request.setReviewedBy(approverUserId);
        request.setReviewedAt(LocalDateTime.now());
        requestRepository.save(request);

        SharingAgreement agreement = new SharingAgreement();
        agreement.setRequestingInstitutionId(request.getRequestingInstitutionId());
        agreement.setOwningInstitutionId(request.getOwningInstitutionId());
        agreement.setEquipmentId(request.getEquipmentId());
        agreement.setStatus("APPROVED");
        agreement.setCostSharingTerms(costSharingTerms);
        agreement.setStartDate(request.getRequestedStartDate());
        agreement.setEndDate(request.getRequestedEndDate());
        agreement.setApprovedBy(approverUserId);
        agreement.setApprovedAt(LocalDateTime.now());

        return agreementRepository.save(agreement);
    }

    @Transactional
    public ResourceSharingRequest rejectRequest(Long approverUserId, Long requestId) {
        ResourceSharingRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sharing request not found."));

        if (!"PENDING".equals(request.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Sharing request is already " + request.getStatus().toLowerCase());
        }

        request.setStatus("REJECTED");
        request.setReviewedBy(approverUserId);
        request.setReviewedAt(LocalDateTime.now());
        return requestRepository.save(request);
    }

    public List<ResourceSharingRequest> getIncomingRequests(Long institutionId) {
        return requestRepository.findByOwningInstitutionIdOrderByCreatedAtDesc(institutionId);
    }

    public List<ResourceSharingRequest> getOutgoingRequests(Long institutionId) {
        return requestRepository.findByRequestingInstitutionIdOrderByCreatedAtDesc(institutionId);
    }

    public List<SharingAgreement> getAgreementsForEquipment(Long equipmentId) {
        return agreementRepository.findByEquipmentId(equipmentId);
    }

    public boolean hasActiveAgreement(Long equipmentId, LocalDate date) {
        return !agreementRepository.findActiveAgreement(equipmentId, date).isEmpty();
    }

    public List<SharingAgreement> getActiveAgreements(Long equipmentId, LocalDate date) {
        return agreementRepository.findActiveAgreement(equipmentId, date);
    }
}
