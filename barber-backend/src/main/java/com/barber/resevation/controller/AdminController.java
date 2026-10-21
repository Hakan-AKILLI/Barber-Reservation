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
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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

    /* --- RANDEVU YÖNETİMİ --- */

    @GetMapping("/appointments")
    public ResponseEntity<List<Appointment>> getDailyAppointments(
            @RequestParam Long shopId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(appointmentService.getDailyAppointments(shopId, date));
    }

    @PatchMapping("/appointments/{id}/status")
    public ResponseEntity<Appointment> updateAppointmentStatus(
            @RequestParam Long shopId, // KRİTİK EKLENTİ: Adminin yetkisini doğrulamak için eklendi
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

    // Berberin toplu slot üretmesi: POST /api/v1/admin/slots/generate
    @PostMapping("/generate")
    public ResponseEntity<List<TimeSlot>> generateSlots(
            @RequestParam Long shopId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime end,
            @RequestParam int duration) {

        return ResponseEntity.ok(timeSlotService.generateSlots(shopId, date, start, end, duration));
    }
    // Berberin boş slot silmesi: DELETE /api/v1/admin/slots/{id}
    @DeleteMapping("/slots/{id}")
    public ResponseEntity<Void> deleteSlot(
            @PathVariable Long id,
            @RequestParam Long shopId) {
        timeSlotService.deleteSlot(id, shopId);
        return ResponseEntity.noContent().build();
    }
}