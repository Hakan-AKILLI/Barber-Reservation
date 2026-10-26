package com.barber.resevation.service;


import com.barber.resevation.entity.Shop;
import com.barber.resevation.repository.ShopRepository;
import org.springframework.stereotype.Service;
import com.barber.resevation.dto.ShopUpdateRequest;
import org.springframework.transaction.annotation.Transactional;


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
    @Transactional
    public Shop updateShopDetails(Long shopId, ShopUpdateRequest request) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Dükkan bulunamadı!"));

        shop.setName(request.getName());
        shop.setPhone(request.getPhone());
        shop.setAddress(request.getAddress());

        return shopRepository.save(shop);
    }

    @Transactional
    public Shop updateShopStatus(Long shopId, boolean isActive) {
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new RuntimeException("Dükkan bulunamadı!"));

        shop.setActive(isActive);
        return shopRepository.save(shop);
    }
}
