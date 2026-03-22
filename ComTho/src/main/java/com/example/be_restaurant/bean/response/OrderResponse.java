package com.example.be_restaurant.bean.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class OrderResponse {
    private Long orderId;

    private Long deskId;

    private Double discount;

    private Double totalAmount;

    private String note;

    private LocalDateTime createdAt;

    private List<OrderDetailResponse> orderDetails;
}
