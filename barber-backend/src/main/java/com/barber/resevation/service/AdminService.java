package com.barber.resevation.service;

import com.barber.resevation.dto.AdminSecurityUpdateRequest;
import com.barber.resevation.entity.Admin;
import com.barber.resevation.repository.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void updateSecurityInfo(Long adminId, AdminSecurityUpdateRequest request) {
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Yönetici bulunamadı!"));

        // 1. Mevcut şifre doğru mu kontrol et
        if (!passwordEncoder.matches(request.getCurrentPassword(), admin.getPassword())) {
            throw new RuntimeException("Mevcut şifrenizi yanlış girdiniz!");
        }

        // 2. Kullanıcı adını güncelle
        admin.setUsername(request.getUsername());

        // 3. Yeni şifreyi BCrypt ile şifrele (hash) ve kaydet
        admin.setPassword(passwordEncoder.encode(request.getNewPassword()));

        adminRepository.save(admin);
    }
}