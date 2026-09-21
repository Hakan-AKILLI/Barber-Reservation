package com.barber.resevation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppointmentBookingRequest {

    @NotNull(message = "Seçilen saat dilimi (slot) zorunludur")
    private Long timeSlotId;

    @NotBlank(message = "Müşteri adı zorunludur")
    private String customerName;

    @NotBlank(message = "Telefon numarası zorunludur")
    @Pattern(regexp = "^(05|5)[0-9]{9}$", message = "Geçerli bir Türkiye cep telefonu giriniz (Örn: 05xxxxxxxxx)")
    private String customerPhone;

    @NotBlank(message = "Hizmet türü seçilmelidir")
    private String serviceType; // Örn: "Saç Kesimi", "Sakal Tıraşı"
}
