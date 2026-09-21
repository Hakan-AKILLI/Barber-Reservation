package com.barber.resevation.service;

import com.barber.resevation.entity.Appointment;
import com.barber.resevation.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WhatsAppReminderScheduler {

    private final AppointmentRepository appointmentRepository;

    // KURAL 1: Her gün saat 19:00'da çalışır ve yarınki randevulara mesaj atar
    @Scheduled(cron = "0 0 19 * * *", zone = "Europe/Istanbul")
    @Transactional
    public void sendOneDayBeforeReminders() {
        LocalDate tomorrow = LocalDate.now()
                .plusDays(1);
        List<Appointment> appointments = appointmentRepository.findAppointmentsForTomorrow(tomorrow);

        for (Appointment app : appointments) {
            sendWhatsAppMessage(app.getCustomerPhone(),
                    "Merhaba " + app.getCustomerName() + ", yarın saat " + app.getTimeSlot()
                            .getStartTime() + " için randevunuz bulunmaktadır.");
            app.setReminder1DaySent(true);
        }
        appointmentRepository.saveAll(appointments);
    }

    // KURAL 2: Her 5 dakikada bir çalışır, tam 2 saat kalanları bulur
    @Scheduled(fixedRate = 300000) // 5 dakika (milisaniye cinsinden)
    @Transactional
    public void sendTwoHoursBeforeReminders() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        LocalTime targetStart = now.plusHours(2);
        LocalTime targetEnd = targetStart.plusMinutes(5); // 5 dakikalık tolerans aralığı

        List<Appointment> appointments = appointmentRepository.findAppointmentsInTimeRangeFor2Hours(today, targetStart, targetEnd);

        for (Appointment app : appointments) {
            sendWhatsAppMessage(app.getCustomerPhone(),
                    "Hatırlatma: Randevunuza 2 saat kaldı. (" + app.getTimeSlot()
                            .getStartTime() + ")");
            app.setReminder2HoursSent(true);
        }
        appointmentRepository.saveAll(appointments);
    }

    // KURAL 3: Her 5 dakikada bir çalışır, tam 30 dakika kalanları bulur
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void sendThirtyMinsBeforeReminders() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        LocalTime targetStart = now.plusMinutes(30);
        LocalTime targetEnd = targetStart.plusMinutes(5);

        List<Appointment> appointments = appointmentRepository.findAppointmentsInTimeRangeFor30Mins(today, targetStart, targetEnd);

        for (Appointment app : appointments) {
            sendWhatsAppMessage(app.getCustomerPhone(),
                    "Hatırlatma: Randevunuza yarım saat kaldı. (" + app.getTimeSlot()
                            .getStartTime() + ")");
            app.setReminder30MinSent(true);
        }
        appointmentRepository.saveAll(appointments);
    }

    // Gerçek WhatsApp API entegrasyonunun yapılacağı metod
    private void sendWhatsAppMessage(String phoneNumber, String message) {
        // Şimdilik sadece konsola yazdırıyoruz.
        // İleride buraya Twilio, Meta WhatsApp API veya Netgsm HTTP Client kodları gelecek.
        System.out.println("WHATSAPP GÖNDERİLDİ -> TEL: " + phoneNumber + " | MESAJ: " + message);
    }
}