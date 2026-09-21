package com.barber.resevation.controller;

import com.barber.resevation.dto.CreateTimeSlotRequest;
import com.barber.resevation.entity.TimeSlot;
import com.barber.resevation.service.TimeSlotService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/slots")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Frontend baglantisi icin
public class TimeSlotController {

    private final TimeSlotService timeSlotService;

    // Müşterinin boş saatleri çekmesi: GET /api/v1/slots/available?date=2026-09-17
    @GetMapping("/available")
    public ResponseEntity<List<TimeSlot>> getAvailableSlots(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(timeSlotService.getAvailableSlots(date));
    }

    // Berberin tek saat eklemesi: POST /api/v1/slots
    @PostMapping
    public ResponseEntity<TimeSlot> createSlot(@Valid @RequestBody CreateTimeSlotRequest request) {
        return ResponseEntity.ok(timeSlotService.createSlot(request));
    }

    // Berberin toplu slot üretmesi: POST /api/v1/slots/generate?date=2026-09-17&start=09:00&end=19:00&duration=45
    @PostMapping("/generate")
    public ResponseEntity<List<TimeSlot>> generateSlots(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime end,
            @RequestParam(defaultValue = "45") int duration) {
        return ResponseEntity.ok(timeSlotService.generateDailySlots(date, start, end, duration));
    }
}