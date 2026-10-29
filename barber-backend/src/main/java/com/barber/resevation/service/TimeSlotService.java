package com.barber.resevation.service;

import com.barber.resevation.dto.CreateTimeSlotRequest;
import com.barber.resevation.entity.Shop;
import com.barber.resevation.entity.TimeSlot;
import com.barber.resevation.repository.ShopRepository;
import com.barber.resevation.repository.TimeSlotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TimeSlotService {

    private final TimeSlotRepository timeSlotRepository;
    private final ShopRepository shopRepository;

    @Transactional(readOnly = true)
    public List<TimeSlot> getAvailableSlots(Long shopId, LocalDate date) {
        // 1. Önce dükkanın durumunu kontrol et
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Dükkan bulunamadı!"));

        // 2. Eğer dükkan kapalıysa (isActive = false) müşteriye HİÇ slot döndürme
        if (!shop.isActive()) {
            return java.util.Collections.emptyList();
        }

        // 3. Dükkan açıksa mevcut sorguyla boş slotları getir
        return timeSlotRepository.findByShopIdAndSlotDateAndActiveTrueAndBookedFalseOrderByStartTimeAsc(shopId, date);
    }

    // Berberin tekil slot açması
    @Transactional
    public TimeSlot createSlot(Long shopId, CreateTimeSlotRequest request) {

        // 1. Önce slotun ekleneceği dükkanı buluyoruz
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Dükkan bulunamadı!"));

        // 2. Slotu oluştururken dükkanı da içine ekliyoruz
        TimeSlot slot = TimeSlot.builder()
                .shop(shop)
                .slotDate(request.getSlotDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .booked(false)
                .active(true)
                .build();

        return timeSlotRepository.save(slot);
    }

    // Berber için kolaylık: Belirli saat aralığında periyodik (örneğin 45 dk'da bir) slot üretir
    @Transactional
    public List<TimeSlot> generateSlots(Long shopId, LocalDate date, LocalTime start, LocalTime end, int duration) {

        // 1. Önce dükkanı bul
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Dükkan bulunamadı!"));

        List<TimeSlot> slots = new ArrayList<>();
        LocalTime currentTime = start;

        // Slotları üretme döngüsü
        while (currentTime.isBefore(end)) {
            TimeSlot slot = new TimeSlot();
            slot.setShop(shop);
            slot.setSlotDate(date);
            slot.setStartTime(currentTime);
            slot.setEndTime(currentTime.plusMinutes(duration));
            slot.setActive(true);
            slot.setBooked(false);

            slots.add(slot);
            currentTime = currentTime.plusMinutes(duration);
        }

        return timeSlotRepository.saveAll(slots);
    }

    // Berberin boş slot silmesi
    @Transactional
    public void deleteSlot(Long slotId, Long shopId) {
        // 1. Slotun var olup olmadığını buluyoruz
        TimeSlot slot = timeSlotRepository.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot bulunamadı!"));

        // 2. Güvenlik Kontrolü: Slot gerçekten bu dükkana mı ait?
        if (!slot.getShop().getId().equals(shopId)) {
            throw new RuntimeException("Bu slot belirtilen dükkana ait değil!");
        }

        // 3. Randevu Kontrolü: Dolu slotların silinmesini engelliyoruz
        if (Boolean.TRUE.equals(slot.isBooked())) {
            throw new RuntimeException("Dolu olan bir slot silinemez! Önce randevuyu iptal etmelisiniz.");
        }

        // 4. Slotu veritabanından siliyoruz
        timeSlotRepository.delete(slot);
    }

    // Günü kapatmak için o günkü randevusuz (boş) slotları silen metot
    @Transactional
    public void deleteEmptySlotsByDate(Long shopId, LocalDate date) {
        // Java tarafında listeyi çekip "for" döngüsüyle dönmek yerine,
        // işlemi doğrudan veritabanına devrederek tek satırda çözüyoruz.
        int deletedCount = timeSlotRepository.deleteUnbookedSlotsByShopAndDate(shopId, date);
        System.out.println(date + " tarihi için " + deletedCount + " adet boş slot silindi ve gün kapatıldı.");
    }
}