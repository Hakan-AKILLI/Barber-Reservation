package com.barber.resevation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String customerPhone;

    @Column(nullable = false)
    private String serviceType; // Örn: "SAÇ", "SAKAL", "SAÇ + SAKAL"

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "time_slot_id", nullable = false, unique = true) // Bir slot sadece tek randevuya atanabilir!
    private TimeSlot timeSlot;

    @Column(nullable = false)
    private String status; // CONFIRMED, CANCELLED, COMPLETED

    @Column(nullable = false, unique = true)
    private String cancellationCode;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.cancellationCode == null) {
            this.cancellationCode = UUID.randomUUID()
                    .toString()
                    .substring(0, 8);
        }
        if (this.status == null) {
            this.status = "CONFIRMED";
        }
    }
    @Builder.Default
    private boolean reminder1DaySent = false;

    @Builder.Default
    private boolean reminder2HoursSent = false;

    @Builder.Default
    private boolean reminder30MinSent = false;
}