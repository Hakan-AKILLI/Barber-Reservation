package com.barber.resevation.repository;

import com.barber.resevation.entity.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {

    // Müşterinin göreceği liste: O günün boş ve aktif olan saatleri
    List<TimeSlot> findBySlotDateAndActiveTrueAndBookedFalseOrderByStartTimeAsc(LocalDate slotDate);

    // Berberin göreceği liste: O gün açılmış tüm saatler (dolu veya boş)
    List<TimeSlot> findBySlotDateOrderByStartTimeAsc(LocalDate slotDate);
}