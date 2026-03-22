package com.example.be_restaurant.bean.request;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class OrderDetailRequest {
    private String food;
    private int quantity;
    private double discount;
    private double amount;
    private String note;
    private boolean upSizeOption;
}
