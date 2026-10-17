package com.barber.resevation.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "shops")
@Data
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // Örn: Makas Kardeşler

    @Column(nullable = false, unique = true)
    private String slug; // Örn: makas-kardesler (URL'de kullanılacak kısım)

    private String phone;

    private String address;

    // Dükkanın aktif olup olmadığını kontrol etmek için
    private boolean isActive = true;
}