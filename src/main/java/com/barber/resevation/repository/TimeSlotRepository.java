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

    // Müşterinin göreceği liste: O günün boş ve aktif olan saatleri
    List<TimeSlot> findBySlotDateAndActiveTrueAndBookedFalseOrderByStartTimeAsc(LocalDate slotDate);

    // Berberin göreceği liste: O gün açılmış tüm saatler (dolu veya boş)
    List<TimeSlot> findBySlotDateOrderByStartTimeAsc(LocalDate slotDate);

    @Modifying
    @Transactional
    @Query("DELETE FROM TimeSlot t WHERE t.slotDate < :today AND (t.booked = false OR t.booked IS NULL) AND NOT EXISTS (SELECT a FROM Appointment a WHERE a.timeSlot = t)")
    int deletePastUnbookedSlots(@Param("today") LocalDate today);


}