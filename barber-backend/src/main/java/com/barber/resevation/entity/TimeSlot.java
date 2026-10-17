package com.barber.resevation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "time_slots", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"slotDate", "startTime"}) // Aynı güne aynı saat iki kez açılamaz
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimeSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate slotDate; // Örn: 2026-09-12

    @Column(nullable = false)
    private LocalTime startTime; // Örn: 10:00

    @Column(nullable = false)
    private LocalTime endTime; // Örn: 10:45 veya 11:00

    @Builder.Default
    private boolean booked = false; // Biri randevu aldı mı?

    @Builder.Default
    private boolean active = true; // Berber o saati iptal etti mi/kapattı mı?
    // Bu kodu User, Appointment ve Service sınıflarının içine ekle

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

}
