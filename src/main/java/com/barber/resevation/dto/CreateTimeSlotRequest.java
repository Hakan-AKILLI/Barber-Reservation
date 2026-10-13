package com.barber.resevation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
public class CreateTimeSlotRequest {

    @NotNull(message = "Tarih zorunludur")
    @Schema(description = "slotDate", example = "2027-03-26")
    private LocalDate slotDate;

    @NotNull(message = "Başlangıç saati zorunludur")
    @Schema(description = "startTime", example = "14:45:00")
    private LocalTime startTime;

    @NotNull(message = "Bitiş saati zorunludur")
    @Schema(description = "endTime", example = "15:30:00")
    private LocalTime endTime;
}
