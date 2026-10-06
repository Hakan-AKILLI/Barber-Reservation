package com.barber.resevation.controller;

import com.barber.resevation.dto.CreateTimeSlotRequest;
import com.barber.resevation.entity.Appointment;
import com.barber.resevation.entity.TimeSlot;
import com.barber.resevation.service.AppointmentService;
import com.barber.resevation.service.TimeSlotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final AppointmentService appointmentService;
    private final TimeSlotService timeSlotService;

    /* --- RANDEVU YÖNETİMİ --- */

    @GetMapping("/appointments")
    public ResponseEntity<List<Appointment>> getDailyAppointments(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(appointmentService.getDailyAppointments(date));
    }

    @PatchMapping("/appointments/{id}/status")
    public ResponseEntity<Appointment> updateAppointmentStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(appointmentService.updateStatus(id, status));
    }

    /* --- SLOT YÖNETİMİ --- */

    // Berberin tek saat eklemesi: POST /api/v1/admin/slots
    @PostMapping("/slots")
    public ResponseEntity<TimeSlot> createSlot(@Valid @RequestBody CreateTimeSlotRequest request) {
        return ResponseEntity.ok(timeSlotService.createSlot(request));
    }

    // Berberin toplu slot üretmesi: POST /api/v1/admin/slots/generate
    @PostMapping("/slots/generate")
    public ResponseEntity<List<TimeSlot>> generateSlots(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime end,
            @RequestParam(defaultValue = "45") int duration) {
        return ResponseEntity.ok(timeSlotService.generateDailySlots(date, start, end, duration));
    }
}