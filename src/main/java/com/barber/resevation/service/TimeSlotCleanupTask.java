package com.barber.resevation.service;

import com.barber.resevation.repository.TimeSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class TimeSlotCleanupTask {

    private final TimeSlotRepository timeSlotRepository;

    // "Saniye Dakika Saat Gün Ay HaftanınGünü" formatı
    // 0 0 3 * * ? -> Her gün gece saat 03:00'te çalışır
    @Scheduled(fixedRate = 300000)
    public void cleanUpPastUnbookedSlots() {
        log.info("Geçmiş tarihli boş randevu slotlarını temizleme işlemi başlatıldı...");

        LocalDate today = LocalDate.now();
        int deletedCount = timeSlotRepository.deletePastUnbookedSlots(today);

        log.info("Temizleme tamamlandı. Toplam silinen geçmiş boş slot sayısı: {}", deletedCount);
    }
}