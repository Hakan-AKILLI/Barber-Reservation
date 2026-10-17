package com.barber.resevation.controller;

import com.barber.resevation.dto.AppointmentBookingRequest;
import com.barber.resevation.entity.Appointment;
import com.barber.resevation.service.AppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AppointmentController {

    private final AppointmentService appointmentService;

    // Randevu al: POST /api/v1/appointments
    @PostMapping
    public ResponseEntity<Appointment> bookAppointment(@Valid @RequestBody AppointmentBookingRequest request) {
        return ResponseEntity.ok(appointmentService.bookAppointment(request));
    }

    // Randevu iptal et: DELETE /api/v1/appointments/cancel/{cancellationCode}
    @DeleteMapping("/cancel/{cancellationCode}")
    public ResponseEntity<String> cancelAppointment(@PathVariable String cancellationCode) {
        appointmentService.cancelAppointment(cancellationCode);
        return ResponseEntity.ok("Randevu başarıyla iptal edildi.");
    }
}
