package com.labresource.backend.equipment.service;

import com.labresource.backend.calibration.entity.EquipmentCalibration;
import com.labresource.backend.calibration.repository.EquipmentCalibrationRepository;
import com.labresource.backend.common.exception.ApiException;
import com.labresource.backend.equipment.dto.EquipmentDepartmentAccessDto;
import com.labresource.backend.equipment.dto.EquipmentDto;
import com.labresource.backend.equipment.dto.EquipmentOperatingScheduleDto;
import com.labresource.backend.equipment.entity.*;
import com.labresource.backend.equipment.repository.*;
import com.labresource.backend.storage.CloudinaryUploadResult;
import com.labresource.backend.storage.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentCalibrationRepository calibrationRepository;
    private final EquipmentOperatingScheduleRepository scheduleRepository;
    private final EquipmentDocumentRepository documentRepository;
    private final EquipmentDepartmentAccessRepository accessRepository;
    private final TagRepository tagRepository;
    private final StorageService storageService;

    public List<EquipmentDto> search(String search, String category, Long departmentId, Long institutionId, String status) {
        return equipmentRepository.search(blankToNull(search), blankToNull(category), departmentId, institutionId, blankToNull(status))
                .stream()
                .map(e -> EquipmentDto.fromEntity(e, latestCalibration(e.getEquipmentId())))
                .toList();
    }

    public EquipmentDto getById(Long equipmentId) {
        Equipment equipment = equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Equipment not found."));
        return EquipmentDto.fromEntity(equipment, latestCalibration(equipmentId));
    }

    @Transactional
    public EquipmentDto create(EquipmentDto dto) {
        Equipment eq = new Equipment();
        mapToEntity(dto, eq);
        eq.setStatus(Equipment.AVAILABLE);
        return EquipmentDto.fromEntity(equipmentRepository.save(eq), null);
    }

    @Transactional
    public EquipmentDto update(Long equipmentId, EquipmentDto dto) {
        Equipment eq = getEntity(equipmentId);
        mapToEntity(dto, eq);
        return EquipmentDto.fromEntity(equipmentRepository.save(eq), latestCalibration(equipmentId));
    }

    @Transactional
    public EquipmentDto updateStatus(Long equipmentId, String newStatus, boolean internalCall) {
        Equipment eq = getEntity(equipmentId);
        String current = eq.getStatus();

        if (Equipment.UNDER_MAINTENANCE.equals(current) && Equipment.AVAILABLE.equalsIgnoreCase(newStatus) && !internalCall) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Equipment under maintenance must be restored via the maintenance completion flow.");
        }

        eq.setStatus(newStatus.toUpperCase());
        return EquipmentDto.fromEntity(equipmentRepository.save(eq), latestCalibration(equipmentId));
    }

    @Transactional
    public void setSchedules(Long equipmentId, List<EquipmentOperatingScheduleDto> schedules) {
        // Clear old schedule rows
        List<EquipmentOperatingSchedule> existing = scheduleRepository.findByEquipmentId(equipmentId);
        scheduleRepository.deleteAll(existing);

        for (EquipmentOperatingScheduleDto dto : schedules) {
            EquipmentOperatingSchedule sched = new EquipmentOperatingSchedule();
            sched.setEquipmentId(equipmentId);
            sched.setDayOfWeek(dto.getDayOfWeek());
            sched.setOpenTime(dto.getOpenTime());
            sched.setCloseTime(dto.getCloseTime());
            sched.setIsAvailable(Boolean.TRUE.equals(dto.getIsAvailable()));
            scheduleRepository.save(sched);
        }
    }

    @Transactional
    public void uploadDocument(Long equipmentId, String docType, MultipartFile file, Long userId) throws IOException {
        CloudinaryUploadResult result = storageService.upload(file, "equipment_documents");
        EquipmentDocument doc = new EquipmentDocument();
        doc.setEquipmentId(equipmentId);
        doc.setDocumentType(docType.toUpperCase());
        doc.setDocumentName(file.getOriginalFilename());
        doc.setCloudinaryPublicId(result.getPublicId());
        doc.setCloudinarySecureUrl(result.getSecureUrl());
        doc.setFileSize(file.getSize());
        doc.setContentType(file.getContentType());
        doc.setUploadedBy(userId);
        documentRepository.save(doc);
    }

    @Transactional
    public void uploadImage(Long equipmentId, MultipartFile file) throws IOException {
        Equipment eq = getEntity(equipmentId);
        // Delete old image if it exists
        if (eq.getImagePublicId() != null) {
            storageService.delete(eq.getImagePublicId());
        }

        CloudinaryUploadResult result = storageService.upload(file, "equipment_images");
        eq.setImagePublicId(result.getPublicId());
        eq.setImageSecureUrl(result.getSecureUrl());
        eq.setImageFileName(file.getOriginalFilename());
        eq.setImageContentType(file.getContentType());
        equipmentRepository.save(eq);
    }

    @Transactional
    public void setAccess(Long equipmentId, List<EquipmentDepartmentAccessDto> accessList) {
        // Delete existing access definitions
        List<EquipmentDepartmentAccess> existing = accessRepository.findByEquipmentId(equipmentId);
        accessRepository.deleteAll(existing);

        for (EquipmentDepartmentAccessDto dto : accessList) {
            EquipmentDepartmentAccess access = new EquipmentDepartmentAccess();
            access.setEquipmentId(equipmentId);
            access.setDepartmentId(dto.getDepartmentId());
            access.setAccessLevel(dto.getAccessLevel().toUpperCase());
            accessRepository.save(access);
        }
    }

    private void mapToEntity(EquipmentDto dto, Equipment eq) {
        eq.setName(dto.getName());
        eq.setCategory(dto.getCategory());
        eq.setSerialNumber(dto.getSerialNumber());
        eq.setManufacturer(dto.getManufacturer());
        eq.setModel(dto.getModel());
        eq.setLocation(dto.getLocation());
        eq.setCapacityPerSlot(dto.getCapacityPerSlot() == null ? 1 : dto.getCapacityPerSlot());
        eq.setIsShareable(Boolean.TRUE.equals(dto.getIsShareable()));
        eq.setDepartmentId(dto.getDepartmentId());
        eq.setInstitutionId(dto.getInstitutionId());
        eq.setSpecifications(dto.getSpecifications());
        eq.setCalibrationRequired(Boolean.TRUE.equals(dto.getCalibrationRequired()));
        eq.setCalibrationIntervalMonths(dto.getCalibrationIntervalMonths());
    }

    public Equipment getEntity(Long equipmentId) {
        return equipmentRepository.findById(equipmentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Equipment not found."));
    }

    public EquipmentCalibration latestCalibration(Long equipmentId) {
        return calibrationRepository.findByEquipmentIdOrderByNextDueDateDesc(equipmentId).stream()
                .max(Comparator.comparing(EquipmentCalibration::getNextDueDate))
                .orElse(null);
    }

    public boolean hasValidCalibration(Long equipmentId) {
        Equipment eq = getEntity(equipmentId);
        if (Boolean.FALSE.equals(eq.getCalibrationRequired())) {
            return true; // No calibration required
        }
        EquipmentCalibration latest = latestCalibration(equipmentId);
        return latest != null && !latest.getNextDueDate().isBefore(LocalDate.now());
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
