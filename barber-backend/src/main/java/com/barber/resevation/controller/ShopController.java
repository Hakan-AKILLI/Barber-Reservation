package com.barber.resevation.controller;

import com.barber.resevation.entity.Shop;
import com.barber.resevation.service.ShopService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/shops")
public class ShopController {

    private final ShopService shopService;

    public ShopController(ShopService shopService) {
        this.shopService = shopService;
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<?> getShopBySlug(@PathVariable String slug) {
        try {
            Shop shop = shopService.getShopBySlug(slug);
            return ResponseEntity.ok(shop);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound()
                    .build();
        }
    }
}
