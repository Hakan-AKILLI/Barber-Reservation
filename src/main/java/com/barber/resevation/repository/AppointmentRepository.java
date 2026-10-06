package com.barber.resevation.repository;

import com.barber.resevation.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    Optional<Appointment> findByCancellationCode(String cancellationCode);
    // Yarınki randevuları bul (1 Gün Öncesi için)
    @Query("SELECT a FROM Appointment a WHERE a.status = 'CONFIRMED' AND a.timeSlot.slotDate = :tomorrow AND a.reminder1DaySent = false")
    List<Appointment> findAppointmentsForTomorrow(@Param("tomorrow") LocalDate tomorrow);

    // Belirli bir saat aralığındaki randevuları bul (2 saat ve 30 dk öncesi için)
    @Query("SELECT a FROM Appointment a WHERE a.status = 'CONFIRMED' AND a.timeSlot.slotDate = :today " +
            "AND a.timeSlot.startTime >= :start AND a.timeSlot.startTime <= :end AND a.reminder2HoursSent = false")
    List<Appointment> findAppointmentsInTimeRangeFor2Hours(@Param("today") LocalDate today,
                                                           @Param("start") LocalTime start,
                                                           @Param("end") LocalTime end);

    @Query("SELECT a FROM Appointment a WHERE a.status = 'CONFIRMED' AND a.timeSlot.slotDate = :today " +
            "AND a.timeSlot.startTime >= :start AND a.timeSlot.startTime <= :end AND a.reminder30MinSent = false")
    List<Appointment> findAppointmentsInTimeRangeFor30Mins(@Param("today") LocalDate today,
                                                           @Param("start") LocalTime start,
                                                           @Param("end") LocalTime end);
    // Admin için seçilen günün randevularını saate göre sıralı getirir
    @Query("SELECT a FROM Appointment a WHERE a.timeSlot.slotDate = :date ORDER BY a.timeSlot.startTime ASC")
    List<Appointment> findAppointmentsByDate(@Param("date") LocalDate date);
}
