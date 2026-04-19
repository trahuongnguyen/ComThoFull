package com.example.be_restaurant.controller;

import com.example.be_restaurant.entity.Bill;
import com.example.be_restaurant.service.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/bill")
public class BillController {
    private final BillService billService;

    @PostMapping("/{shiftId}/{deskId}/{payment}")
    public void createBill(
            @PathVariable Long shiftId,
            @PathVariable Long deskId,
            @PathVariable String payment,
            @RequestParam Double discount) {

        Bill bill = billService.createBill(shiftId, deskId, payment, discount);
        byte[] pdfBytes = billService.generatePaymentInvoicePdf(bill.getId());

    }


}
