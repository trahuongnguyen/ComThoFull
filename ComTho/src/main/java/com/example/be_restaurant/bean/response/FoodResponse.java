package com.example.be_restaurant.bean.response;

import lombok.Data;

@Data
public class FoodResponse {
    private Long id;
    private String name;
    private double price;
    private boolean canUpSize;
    private double upSizePrice;
    private Long categoryId;
}
