package com.barber.resevation.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // İstekte Authorization başlığı yoksa veya "Bearer " ile başlamıyorsa diğer filtrelere geç (belki public bir uç noktadır)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // "Bearer " kelimesinden sonrasını (asıl token kısmını) al
        final String jwt = authHeader.substring(7);

        try {
            String username = jwtService.extractUsername(jwt);

            // Kullanıcı adı varsa ve henüz Spring Security bağlamında oturum açılmamışsa
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (jwtService.isTokenValid(jwt)) {
                    // Token geçerliyse Spring Security'ye "Bu adam yetkili, içeri al" diyoruz
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            username, null, new ArrayList<>()
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Token süresi geçmiş veya bozuk
        }

        filterChain.doFilter(request, response);
    }
}