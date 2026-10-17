package com.barber.resevation.service;

import com.barber.resevation.dto.AppointmentBookingRequest;
import com.barber.resevation.entity.Appointment;
import com.barber.resevation.entity.TimeSlot;
import com.barber.resevation.repository.AppointmentRepository;
import com.barber.resevation.repository.TimeSlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final TimeSlotRepository timeSlotRepository;
    private final WhatsAppNotificationService whatsAppNotificationService;

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
                .shop(slot.getShop()) // KRİTİK EKLENTİ: Randevuyu slotun ait olduğu dükkana bağlıyoruz
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .serviceType(request.getServiceType())
                .timeSlot(slot)
                .build();

        // Veritabanına kaydet ve kaydedilen objeyi bir değişkene al
        Appointment savedAppointment = appointmentRepository.save(appointment);

        // 4. WhatsApp üzerinden randevu onay mesajını gönder
        whatsAppNotificationService.sendAppointmentConfirmation(savedAppointment.getCustomerPhone());

        return savedAppointment;
    }

    @Transactional
    public void cancelAppointment(String cancellationCode) {
        // İptal kodu zaten eşsiz (unique) olduğu için burada shopId'ye gerek yok.
        Appointment appointment = appointmentRepository.findByCancellationCode(cancellationCode)
                .orElseThrow(() -> new IllegalArgumentException("Geçersiz iptal kodu."));

        appointment.setStatus("CANCELLED");

        // Slot'u tekrar diğer müşterilerin seçebilmesi için serbest bırak
        TimeSlot slot = appointment.getTimeSlot();
        slot.setBooked(false);
        timeSlotRepository.save(slot);

        appointmentRepository.save(appointment);

        // WhatsApp İptal Mesajı Gönderme
        whatsAppNotificationService.sendAppointmentCancellation(appointment.getCustomerPhone());
    }

    // Admin: Belirli bir dükkanın ve günün randevularını listeleme
    @Transactional(readOnly = true)
    public List<Appointment> getDailyAppointments(Long shopId, LocalDate date) {
        return appointmentRepository.findAppointmentsByShopAndDate(shopId, date);
    }

    // Admin: Randevu durumunu güncelleme (COMPLETED / CANCELLED vs.)
    @Transactional
    public Appointment updateStatus(Long shopId, Long id, String newStatus) { // shopId parametresi eklendi
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Randevu bulunamadı."));

        // GÜVENLİK KONTROLÜ: İşlem yapılmak istenen randevu, işlemi yapan adminin dükkanına mı ait?
        if (!appointment.getShop().getId().equals(shopId)) {
            throw new IllegalStateException("Bu randevu üzerinde işlem yapma yetkiniz bulunmuyor.");
        }

        appointment.setStatus(newStatus.toUpperCase());

        // Eğer yönetici randevuyu "CANCELLED" yaparsa, slotu tekrar boşa çıkar
        if ("CANCELLED".equalsIgnoreCase(newStatus)) {
            TimeSlot slot = appointment.getTimeSlot();
            slot.setBooked(false);
            timeSlotRepository.save(slot);
        }

        return appointmentRepository.save(appointment);
    }
}