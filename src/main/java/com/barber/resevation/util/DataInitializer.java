package com.barber.resevation.util;

import com.barber.resevation.entity.Admin;
import com.barber.resevation.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Eğer veritabanında hiç admin yoksa, varsayılan bir tane oluştur
        if (adminRepository.count() == 0) {
            Admin defaultAdmin = Admin.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("123456")) // Şifre düz metin değil, hashlenerek kaydediliyor
                    .build();

            adminRepository.save(defaultAdmin);
            System.out.println("Varsayılan admin hesabı oluşturuldu! Kullanıcı adı: admin | Şifre: 123456");
        }
    }
}