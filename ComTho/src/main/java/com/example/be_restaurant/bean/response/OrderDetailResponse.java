package com.example.be_restaurant.bean.response;

import lombok.Data;

@Data
public class OrderDetailResponse {
    private Long foodId;

    private String foodName;

    private int count;

    private boolean canUpSize;

    private Long toppingId;

    private String toppingName;
}
