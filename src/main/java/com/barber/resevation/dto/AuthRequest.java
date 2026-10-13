package com.barber.resevation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class AuthRequest {
    @Schema(description = "username", example = "admin")
    private String username;
    @Schema(description = "password", example = "123456")
    private String password;
}