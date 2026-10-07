package com.barber.resevation.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    // Token'ı şifrelemek için 256-bit (en az 32 karakter) uzunluğunda çok gizli bir anahtar.
    // Canlıya alırken bu anahtarı application.properties içine taşıyabilirsin.
    private static final String SECRET_KEY = "BarberAppSuperSecretKeyForJwtAuthentication!";

    private final SecretKey key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));

    public String generateToken(String username) {
        return Jwts.builder()
                .subject(username) // Token'ın kime ait olduğu
                .issuedAt(new Date(System.currentTimeMillis())) // Veriliş zamanı
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24)) // 24 saat geçerlilik
                .signWith(key) // Gizli anahtarımızla imzalıyoruz
                .compact();
    }
    // Token'ın içinden kullanıcı adını (admin) çıkarır
    public String extractUsername(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // Token'ın bizim gizli anahtarımızla mı üretildiğini ve süresinin dolup dolmadığını kontrol eder
    public boolean isTokenValid(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false; // Token bozuksa veya süresi dolmuşsa false döner
        }
    }
}