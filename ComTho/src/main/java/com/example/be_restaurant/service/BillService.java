package com.example.be_restaurant.service;

import com.example.be_restaurant.bean.request.OrderTempRequest;
import com.example.be_restaurant.entity.Bill;
import org.springframework.stereotype.Service;

@Service
public interface BillService {
    Bill createBill(Long shiftId, Long deskId, String payment, Double discount);
    byte[] generateKitchenInvoicePdf(OrderTempRequest orderTempRequest);
    byte[] generatePaymentInvoicePdf(Long billId);
}
