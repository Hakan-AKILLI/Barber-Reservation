package com.barber.resevation.controller;

import com.barber.resevation.dto.CreateTimeSlotRequest;
import com.barber.resevation.entity.Appointment;
import com.barber.resevation.entity.TimeSlot;
import com.barber.resevation.service.AppointmentService;
import com.barber.resevation.service.TimeSlotService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.barber.resevation.dto.AdminSecurityUpdateRequest;
import com.barber.resevation.service.AdminService;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@SecurityRequirement(name = "Bearer Authentication")
public class AdminController {

    private final AppointmentService appointmentService;
    private final TimeSlotService timeSlotService;
    private final AdminService adminService;

    /* --- RANDEVU YÖNETİMİ --- */

    @GetMapping("/appointments")
    public ResponseEntity<List<Appointment>> getDailyAppointments(
            @RequestParam Long shopId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(appointmentService.getDailyAppointments(shopId, date));
    }

    @PatchMapping("/appointments/{id}/status")
    public ResponseEntity<Appointment> updateAppointmentStatus(
            @RequestParam Long shopId,
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(appointmentService.updateStatus(shopId, id, status));
    }

    /* --- SLOT YÖNETİMİ --- */

    // Berberin tek saat eklemesi: POST /api/v1/admin/slots
    @PostMapping("/slots")
    public ResponseEntity<TimeSlot> createSlot(
            @RequestParam Long shopId,
            @RequestBody CreateTimeSlotRequest request) {
        return ResponseEntity.ok(timeSlotService.createSlot(shopId, request));
    }

    // Berberin toplu slot üretmesi: POST /api/v1/admin/generate
    @PostMapping("/generate")
    public ResponseEntity<List<TimeSlot>> generateSlots(
            @RequestParam Long shopId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime end,
            @RequestParam int duration) {
        return ResponseEntity.ok(timeSlotService.generateSlots(shopId, date, start, end, duration));
    }

    // Günü Kapatma (Boş Slotları Silme): DELETE /api/v1/admin/slots/by-date
    @DeleteMapping("/slots/by-date")
    public ResponseEntity<?> closeDayByDeletingEmptySlots(
            @RequestParam Long shopId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        timeSlotService.deleteEmptySlotsByDate(shopId, date);
        return ResponseEntity.ok("Seçilen tarihteki boş slotlar başarıyla temizlendi.");
    }

    // Berberin boş slot silmesi: DELETE /api/v1/admin/slots/{id}
    @DeleteMapping("/slots/{id}")
    public ResponseEntity<Void> deleteSlot(
            @PathVariable Long id,
            @RequestParam Long shopId) {
        timeSlotService.deleteSlot(id, shopId);
        return ResponseEntity.noContent().build();
    }

    /* --- GÜVENLİK --- */

    @PutMapping("/{adminId}/security")
    public ResponseEntity<?> updateSecurity(@PathVariable Long adminId, @RequestBody AdminSecurityUpdateRequest request) {
        try {
            adminService.updateSecurityInfo(adminId, request);
            return ResponseEntity.ok("Güvenlik bilgileri başarıyla güncellendi.");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}