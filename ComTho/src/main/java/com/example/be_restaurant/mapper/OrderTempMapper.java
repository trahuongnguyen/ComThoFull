package com.example.be_restaurant.mapper;

import com.example.be_restaurant.bean.request.OrderDetailTempRequest;
import com.example.be_restaurant.bean.request.OrderTempRequest;
import com.example.be_restaurant.entity.OrderTemp;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.util.List;

public class OrderTempMapper {
    private static final ObjectMapper objectMapper = new ObjectMapper();

    public static OrderTemp toEntity(OrderTempRequest request) {
        OrderTemp orderTemp = new OrderTemp();
        orderTemp.setNote(request.getNote());
        orderTemp.setDeskId(request.getDeskId());
        orderTemp.setDiscount(request.getDiscount());
        orderTemp.setStartTime(request.getStartTime());
        try {
            // convert orderDetails -> JSON string
            String ordersJson = objectMapper.writeValueAsString(request.getOrderDetails());
            orderTemp.setOrders(ordersJson);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Cannot convert order details to JSON", e);
        }

        return orderTemp;
    }
    public static OrderTempRequest toRequest(OrderTemp orderTemp) {
        OrderTempRequest response = new OrderTempRequest();
        response.setDeskId(orderTemp.getDeskId());
        response.setDiscount(orderTemp.getDiscount());
        response.setNote(orderTemp.getNote());
        response.setStartTime(orderTemp.getStartTime());

        if (orderTemp.getOrders() == null || orderTemp.getOrders().isBlank()) {
            response.setOrderDetails(List.of());
            return response;
        }

        try {
            List<OrderDetailTempRequest> details =
                    objectMapper.readValue(
                            orderTemp.getOrders(),
                            new TypeReference<List<OrderDetailTempRequest>>() {}
                    );
            response.setOrderDetails(details);
        } catch (Exception e) {
            throw new RuntimeException("Cannot deserialize orders JSON", e);
        }

        return response;
    }
}
