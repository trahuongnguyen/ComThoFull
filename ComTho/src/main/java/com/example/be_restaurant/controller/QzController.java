package com.example.be_restaurant.controller;

import com.example.be_restaurant.service.QzSigningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/qz")
public class QzController {

    private final QzSigningService qzSigningService;

    /**
     * QZ Tray sẽ fetch certificate PEM để trust cho chữ ký.
     * Endpoint này nên public (không nhạy cảm).
     */
    @GetMapping(value = "/cert", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> getCertificate() {
        return ResponseEntity.ok(qzSigningService.getCertificatePem());
    }

    /**
     * Frontend gửi payload cần ký từ QZ Tray -> backend trả về signature base64.
     * Lưu ý: production nên yêu cầu auth + audit log.
     */
    @PostMapping(value = "/sign", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, String>> sign(@RequestBody Map<String, String> body) {
        String payload = body.getOrDefault("payload", "");
        if (payload.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "payload is required"));
        }
        String signature = qzSigningService.sign(payload);
        return ResponseEntity.ok(Map.of("signature", signature));
    }
}

