package com.barber.resevation.dto;

import lombok.Data;

@Data
public class AdminSecurityUpdateRequest {
    private String username;
    private String currentPassword;
    private String newPassword;
}
