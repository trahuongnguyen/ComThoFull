package com.example.be_restaurant.bean.request;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
public class OrderTempRequest {
    private Long deskId;

    private Double discount;

    private String note;
    private LocalDateTime startTime;

    private List<OrderDetailTempRequest> orderDetails;
}
