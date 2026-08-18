package com.labresource.backend.scheduler;

import com.labresource.backend.calibration.repository.EquipmentCalibrationRepository;
import com.labresource.backend.equipment.entity.Equipment;
import com.labresource.backend.equipment.repository.EquipmentRepository;
import com.labresource.backend.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CalibrationReminderJob {

    private final EquipmentRepository equipmentRepository;
    private final EquipmentCalibrationRepository calibrationRepository;
    private final NotificationService notificationService;

    @Scheduled(cron = "0 0 6 * * *") // run daily at 6:00 AM
    public void checkCalibrations() {
        log.info("Running CalibrationReminderJob...");
        List<Equipment> equipmentList = equipmentRepository.findAll();
        LocalDate warningThreshold = LocalDate.now().plusDays(30);

        for (Equipment e : equipmentList) {
            calibrationRepository.findByEquipmentIdOrderByNextDueDateDesc(e.getEquipmentId()).stream()
                    .findFirst()
                    .ifPresent(c -> {
                        if (c.getNextDueDate().isBefore(LocalDate.now())) {
                            notificationService.notifyDepartmentLabManagers(
                                    e.getDepartmentId(),
                                    "CALIBRATION_OVERDUE",
                                    "Calibration Overdue: " + e.getName(),
                                    "The calibration for \"" + e.getName() + "\" expired on " + c.getNextDueDate() + ". Bookings are currently disabled."
                            );
                        } else if (c.getNextDueDate().isBefore(warningThreshold)) {
                            notificationService.notifyDepartmentLabManagers(
                                    e.getDepartmentId(),
                                    "CALIBRATION_DUE_SOON",
                                    "Calibration Due Soon: " + e.getName(),
                                    "The calibration for \"" + e.getName() + "\" is due on " + c.getNextDueDate() + ". Please schedule calibration."
                            );
                        }
                    });
        }
    }
}
