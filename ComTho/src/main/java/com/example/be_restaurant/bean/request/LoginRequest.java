package com.example.be_restaurant.bean.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Vui lòng nhập Username")
    private String username;
    @NotBlank(message = "Vui lòng nhập Password")
    private String password;
}