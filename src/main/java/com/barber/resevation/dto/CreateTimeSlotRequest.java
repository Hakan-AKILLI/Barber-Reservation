package com.barber.resevation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class CreateTimeSlotRequest {

    @NotNull(message = "Tarih zorunludur")
    private LocalDate slotDate;

    @NotNull(message = "Başlangıç saati zorunludur")
    private LocalTime startTime;

    @NotNull(message = "Bitiş saati zorunludur")
    private LocalTime endTime;
}
