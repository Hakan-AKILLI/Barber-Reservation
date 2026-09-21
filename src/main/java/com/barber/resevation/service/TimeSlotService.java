package com.barber.resevation.service;

import com.barber.resevation.dto.CreateTimeSlotRequest;
import com.barber.resevation.entity.TimeSlot;
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

    // Müşterinin göreceği boş ve aktif slotlar
    @Transactional(readOnly = true)
    public List<TimeSlot> getAvailableSlots(LocalDate date) {
        return timeSlotRepository.findBySlotDateAndActiveTrueAndBookedFalseOrderByStartTimeAsc(date);
    }

    // Berberin tekil slot açması
    @Transactional
    public TimeSlot createSlot(CreateTimeSlotRequest request) {
        TimeSlot slot = TimeSlot.builder()
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
    public List<TimeSlot> generateDailySlots(LocalDate date, LocalTime workStart, LocalTime workEnd, int durationMinutes) {
        List<TimeSlot> generatedSlots = new ArrayList<>();
        LocalTime current = workStart;

        while (current.plusMinutes(durationMinutes)
                .isBefore(workEnd) || current.plusMinutes(durationMinutes)
                .equals(workEnd)) {
            LocalTime next = current.plusMinutes(durationMinutes);
            TimeSlot slot = TimeSlot.builder()
                    .slotDate(date)
                    .startTime(current)
                    .endTime(next)
                    .booked(false)
                    .active(true)
                    .build();
            generatedSlots.add(slot);
            current = next;
        }

        return timeSlotRepository.saveAll(generatedSlots);
    }
}
