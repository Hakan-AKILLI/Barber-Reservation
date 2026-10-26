package com.barber.resevation.dto;

import lombok.Data;

@Data
public class ShopUpdateRequest {
    private String name;
    private String phone;
    private String address;
}
