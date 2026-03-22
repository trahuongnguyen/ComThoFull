package com.example.be_restaurant.service.impl;

import com.example.be_restaurant.entity.OrderTemp;
import com.example.be_restaurant.repository.OrderTempRepository;
import com.example.be_restaurant.service.OrderTempService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class OrderTempServiceImpl implements OrderTempService {
    private final OrderTempRepository orderTempRepository;

    @Override
    public void createOrderTemp(OrderTemp orderTemp) {
        orderTempRepository.save(orderTemp);
    }

    @Override
    public void deleteOrderTempByDeskId(Long deskId) {
        orderTempRepository.deleteByDeskId(deskId);
    }
}
