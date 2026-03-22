package com.example.be_restaurant.bean.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ShiftDetailResponse {
    private Long shiftId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer totalProductQuantity;
    private Double totalRevenue; // Doanh thu thuần (tổng total_amount của các bill)
    private Double startCash;
    private Double endCash;

    private List<ProductSummary> products;    // Danh sách món ăn
    private List<PromotionSummary> promotions; // Thông tin giảm giá
    private List<PaymentSummary> payments;    // Các phương thức thanh toán

    @Data
    @AllArgsConstructor
    public static class ProductSummary {
        private String name;
        private Integer quantity;
        private Double total;
    }

    @Data
    @AllArgsConstructor
    public static class PromotionSummary {
        private String name;
        private Integer quantity; // Số hóa đơn áp dụng
        private Double total;    // Tổng số tiền đã giảm
    }

    @Data
    @AllArgsConstructor
    public static class PaymentSummary {
        private String method;
        private Integer count;
        private Double total;
    }
}
