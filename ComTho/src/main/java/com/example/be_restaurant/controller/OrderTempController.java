package com.example.be_restaurant.controller;

import com.example.be_restaurant.bean.request.OrderTempRequest;
import com.example.be_restaurant.entity.OrderTemp;
import com.example.be_restaurant.mapper.OrderTempMapper;
import com.example.be_restaurant.service.BillService;
import com.example.be_restaurant.service.OrderTempService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/orderTemp")
public class OrderTempController {
    private final OrderTempService orderTempService;
    private final BillService billService;


    @PostMapping
    public ResponseEntity<byte[]> createOrderTemp(
            @RequestBody OrderTempRequest orderTempRequest) {

        // 1. Map & save order temp (DB bảng tạm)
        OrderTemp orderTemp = OrderTempMapper.toEntity(orderTempRequest);
        orderTempService.createOrderTemp(orderTemp);

        // 2. Generate PDF phiếu bếp
        byte[] pdfBytes = billService.generateKitchenInvoicePdf(orderTempRequest);

        // 3. Trả PDF cho Electron auto-print
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=kitchen.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @DeleteMapping("/{deskId}")
    public ResponseEntity<?> deleteOrderTempByDeskId(
            @PathVariable Long deskId
    ) {
        orderTempService.deleteOrderTempByDeskId(deskId);
        return ResponseEntity.ok("Deleted order temp by deskId: " + deskId);
    }
}
