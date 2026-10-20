package com.barber.resevation.service;


import com.barber.resevation.entity.Shop;
import com.barber.resevation.repository.ShopRepository;
import org.springframework.stereotype.Service;

@Service
public class ShopService {

    private final ShopRepository shopRepository;

    public ShopService(ShopRepository shopRepository) {
        this.shopRepository = shopRepository;
    }

    public Shop getShopBySlug(String slug) {
        return shopRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Dükkan bulunamadı!"));
    }
}
