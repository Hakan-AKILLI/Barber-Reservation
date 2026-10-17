package com.barber.resevation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppointmentBookingRequest {

    @NotNull(message = "Seçilen saat dilimi (slot) zorunludur")
    @Schema(description = "timeSlotId", example = "1")
    private Long timeSlotId;

    @NotBlank(message = "Müşteri adı zorunludur")
    @Schema(description = "customerName", example = "Hakan")
    private String customerName;

    @NotBlank(message = "Telefon numarası zorunludur")
    @Pattern(regexp = "^(05|5)[0-9]{9}$", message = "Geçerli bir Türkiye cep telefonu giriniz (Örn: 05xxxxxxxxx)")
    @Schema(description = "customerPhone", example = "05386823858")
    private String customerPhone;

    @NotBlank(message = "Hizmet türü seçilmelidir")
    @Schema(description = "serviceType", example = "Saç+Sakal")
    private String serviceType;
}
