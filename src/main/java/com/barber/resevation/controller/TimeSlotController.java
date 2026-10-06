package com.barber.resevation.controller;

import com.barber.resevation.entity.TimeSlot;
import com.barber.resevation.service.TimeSlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
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
}