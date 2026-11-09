package com.barber.resevation.service;

import com.barber.resevation.dto.AdminSecurityUpdateRequest;
import com.barber.resevation.entity.Admin;
import com.barber.resevation.entity.Blacklist;
import com.barber.resevation.entity.Shop;
import com.barber.resevation.repository.AdminRepository;
import com.barber.resevation.repository.BlacklistRepository;
import com.barber.resevation.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final BlacklistRepository blacklistRepository;
    private final ShopRepository shopRepository;

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

    @Transactional
    public void banCustomer(Long shopId, String phone, String reason) {
        // 1. Zaten banlı mı diye kontrol et
        if (blacklistRepository.existsByShopIdAndCustomerPhone(shopId, phone)) {
            throw new RuntimeException("Bu numara zaten kara listede.");
        }

        // 2. Dükkanı bul
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Dükkan bulunamadı"));

        // 3. Kara liste kaydını oluştur ve kaydet
        Blacklist blacklist = Blacklist.builder()
                .shop(shop)
                .customerPhone(phone)
                .reason(reason)
                .bannedAt(LocalDateTime.now())
                .build();

        blacklistRepository.save(blacklist);
    }
}