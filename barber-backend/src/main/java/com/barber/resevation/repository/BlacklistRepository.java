package com.barber.resevation.repository;

import com.barber.resevation.entity.Blacklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BlacklistRepository extends JpaRepository<Blacklist, Long> {
    boolean existsByShopIdAndCustomerPhone(Long shopId, String customerPhone);
}
