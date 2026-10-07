package com.barber.resevation.repository;

import com.barber.resevation.entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {

    // Spring Security giriş yaparken kullanıcıyı bu metotla bulacak
    Optional<Admin> findByUsername(String username);
}
