package com.barber.resevation.repository;

import com.barber.resevation.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {

    // Spring Security giriş yaparken kullanıcıyı bu metotla bulacak (Sistem genelinde unique olmalı)
    Optional<Admin> findByUsername(String username);

    // YENİ: Belirli bir dükkana (shop_id) bağlı olan tüm adminleri/berberleri getir
    List<Admin> findByShopId(Long shopId);
}