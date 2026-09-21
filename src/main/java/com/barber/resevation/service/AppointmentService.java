package com.barber.resevation.service;

import com.barber.resevation.dto.AppointmentBookingRequest;
import com.barber.resevation.entity.Appointment;
import com.barber.resevation.entity.TimeSlot;
import com.barber.resevation.repository.AppointmentRepository;
import com.barber.resevation.repository.TimeSlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final TimeSlotRepository timeSlotRepository;

    @Transactional
    public Appointment bookAppointment(AppointmentBookingRequest request) {
        // 1. Slot var mı ve müsait mi kontrol et
        TimeSlot slot = timeSlotRepository.findById(request.getTimeSlotId())
                .orElseThrow(() -> new IllegalArgumentException("Seçilen saat dilimi bulunamadı."));

        if (!slot.isActive()) {
            throw new IllegalStateException("Bu saat dilimi berber tarafından kapatılmıştır.");
        }

        if (slot.isBooked()) {
            throw new IllegalStateException("Seçtiğiniz saat az önce rezerve edildi, lütfen başka bir saat seçin.");
        }

        // 2. Slot'u kapat (booked = true)
        slot.setBooked(true);
        timeSlotRepository.save(slot);

        // 3. Randevuyu kaydet
        Appointment appointment = Appointment.builder()
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .serviceType(request.getServiceType())
                .timeSlot(slot)
                .build();

        return appointmentRepository.save(appointment);
    }

    @Transactional
    public void cancelAppointment(String cancellationCode) {
        Appointment appointment = appointmentRepository.findByCancellationCode(cancellationCode)
                .orElseThrow(() -> new IllegalArgumentException("Geçersiz iptal kodu."));

        appointment.setStatus("CANCELLED");

        // Slot'u tekrar diğer müşterilerin seçebilmesi için serbest bırak
        TimeSlot slot = appointment.getTimeSlot();
        slot.setBooked(false);
        timeSlotRepository.save(slot);

        appointmentRepository.save(appointment);
    }
}