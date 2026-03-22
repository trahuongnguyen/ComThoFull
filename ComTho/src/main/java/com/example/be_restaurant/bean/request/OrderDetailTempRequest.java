package com.example.be_restaurant.bean.request;

import lombok.Data;

import java.util.List;

@Data
public class OrderDetailTempRequest {
    private Long foodId;
    private int count;
    private boolean canUpSize;
    private List<Long> toppingId;
    private String note;
}
