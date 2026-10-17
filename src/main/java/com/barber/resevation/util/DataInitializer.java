package com.barber.resevation.util;

import com.barber.resevation.entity.Admin;
import com.barber.resevation.entity.Shop;
import com.barber.resevation.repository.AdminRepository;
import com.barber.resevation.repository.ShopRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final AdminRepository adminRepository;
    private final ShopRepository shopRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(AdminRepository adminRepository, ShopRepository shopRepository, PasswordEncoder passwordEncoder) {
        this.adminRepository = adminRepository;
        this.shopRepository = shopRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        // Eğer veritabanında hiç dükkan yoksa ilk dükkanı ve admini oluştur
        if (shopRepository.count() == 0) {

            // 1. İlk Dükkanı Oluştur
            Shop shop = new Shop();
            shop.setName("Admin Shop");
            shop.setSlug("Admin-Shop"); // URL'de bu kullanılacak
            shop.setPhone("0555 444 33 22");
            shop.setAddress("Ankara, Türkiye");
            shop.setActive(true);
            shopRepository.save(shop);

            // 2. Bu dükkana ait Ana Admini Oluştur
            Admin admin = new Admin();
            admin.setUsername("admin"); // Giriş yapacağın kullanıcı adı
            admin.setPassword(passwordEncoder.encode("123456"));
            admin.setShop(shop); // Admini dükkana bağlıyoruz (Çok Önemli!)

            adminRepository.save(admin);

            System.out.println(" SİSTEM BİLGİSİ: İlk Dükkan ve Ana Admin başarıyla oluşturuldu!");
        }
    }
}