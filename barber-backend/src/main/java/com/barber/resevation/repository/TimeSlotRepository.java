package com.barber.resevation.repository;

import com.barber.resevation.entity.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    // GÜNCELLENDİ: Müşterinin göreceği liste: SEÇİLEN DÜKKANIN o günün boş ve aktif olan saatleri
    List<TimeSlot> findByShopIdAndSlotDateAndActiveTrueAndBookedFalseOrderByStartTimeAsc(Long shopId, LocalDate slotDate);

    // GÜNCELLENDİ: Berberin göreceği liste: SEÇİLEN DÜKKANIN o gün açılmış tüm saatleri (dolu veya boş)
    List<TimeSlot> findByShopIdAndSlotDateOrderByStartTimeAsc(Long shopId, LocalDate slotDate);

    // --- SİSTEM GENELİ OTOMATİK TEMİZLEYİCİ (CRON) ---
    // Bu metot tüm dükkanlardaki geçmiş tarihi geçmiş boş saatleri aynı anda temizlemek için global bırakıldı.
    @Modifying
    @Transactional
    @Query("DELETE FROM TimeSlot t WHERE t.slotDate < :today AND (t.booked = false OR t.booked IS NULL) AND NOT EXISTS (SELECT a FROM Appointment a WHERE a.timeSlot = t)")
    int deletePastUnbookedSlots(@Param("today") LocalDate today);

    // --- BELİRLİ BİR DÜKKANIN SEÇİLEN GÜNDEKİ BOŞ SLOTLARINI TEMİZLEME (GÜNÜ KAPATMA) ---
    @Modifying
    @Transactional
    @Query("DELETE FROM TimeSlot t WHERE t.shop = :shop AND t.slotDate = :slotDate AND (t.booked = false OR t.booked IS NULL) AND NOT EXISTS (SELECT a FROM Appointment a WHERE a.timeSlot = t)")
    int deleteUnbookedSlotsByShopAndDate(@Param("shopId") Long shopId, @Param("slotDate") LocalDate slotDate);
}