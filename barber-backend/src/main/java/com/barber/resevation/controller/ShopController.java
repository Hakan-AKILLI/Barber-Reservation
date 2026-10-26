package com.barber.resevation.controller;

import com.barber.resevation.entity.Shop;
import com.barber.resevation.service.ShopService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.barber.resevation.dto.ShopUpdateRequest;
import com.barber.resevation.dto.ShopStatusUpdateRequest;
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
    @PutMapping("/{shopId}")
    public ResponseEntity<?> updateShopDetails(@PathVariable Long shopId, @RequestBody ShopUpdateRequest request) {
        shopService.updateShopDetails(shopId, request);
        return ResponseEntity.ok("Dükkan bilgileri başarıyla güncellendi.");
    }

    @PatchMapping("/{shopId}/status")
    public ResponseEntity<?> updateShopStatus(@PathVariable Long shopId, @RequestBody ShopStatusUpdateRequest request) {
        shopService.updateShopStatus(shopId, request.isActive());
        return ResponseEntity.ok("Dükkan durumu güncellendi.");
    }
}
