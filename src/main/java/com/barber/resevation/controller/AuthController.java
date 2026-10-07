package com.barber.resevation.controller;

import com.barber.resevation.dto.AuthRequest;
import com.barber.resevation.entity.Admin;
import com.barber.resevation.repository.AdminRepository;
import com.barber.resevation.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        // 1. Kullanıcıyı veritabanında ara
        Optional<Admin> adminOptional = adminRepository.findByUsername(request.getUsername());

        if (adminOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Kullanıcı bulunamadı.");
        }

        Admin admin = adminOptional.get();

        // 2. Gönderilen düz şifre (123456) ile veritabanındaki hashli şifreyi kıyasla
        if (!passwordEncoder.matches(request.getPassword(), admin.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Şifre hatalı!");
        }

        // 3. Şifre doğruysa Token üret ve JSON olarak dön
        String token = jwtService.generateToken(admin.getUsername());
        return ResponseEntity.ok(Map.of("token", token));
    }
}
