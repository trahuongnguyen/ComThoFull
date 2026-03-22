package com.example.be_restaurant.controller;

import com.example.be_restaurant.bean.response.ShiftDetailResponse;
import com.example.be_restaurant.entity.Shift;
import com.example.be_restaurant.entity.User;
import com.example.be_restaurant.exception.NotFoundException;
import com.example.be_restaurant.repository.UserRepository;
import com.example.be_restaurant.service.ShiftService;
import com.example.be_restaurant.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/shift")
public class ShiftController {
    private final ShiftService shiftService;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    // 1. Lấy danh sách ca làm việc có phân trang và lọc theo thời gian
    @GetMapping
    public ResponseEntity<Page<Shift>> getAllShifts(
            @RequestParam(defaultValue = "1") String timeRange,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(shiftService.getAllShifts(timeRange, page, size));
    }

    // 2. Lấy chi tiết báo cáo của một ca làm việc (Data cho Angular bạn yêu cầu)
    @GetMapping("/{id}/detail")
    public ResponseEntity<ShiftDetailResponse> getShiftDetail(@PathVariable Long id) {
        return ResponseEntity.ok(shiftService.getShiftById(id));
    }

    // 3. Mở ca làm việc mới
    @PostMapping("/start")
    public ResponseEntity<Shift> startShift(
            @RequestParam Double startCash, HttpServletRequest request) {
        String username = jwtUtil.getCurrentUsername(request);
        User user = userRepository.findByUsernameAndStatus(username, true)
                .orElseThrow(() -> new NotFoundException("User not found", "Không tìm thấy người dùng"));
        return ResponseEntity.ok(shiftService.startShift(user, startCash));
    }

    // 4. Đóng ca làm việc (Kết thúc ca và lưu Summary)
    @PostMapping("/{id}/end")
    public ResponseEntity<Shift> endShift(
            @PathVariable Long id,
            @RequestParam double endCash,
            HttpServletRequest request) {
        String username = jwtUtil.getCurrentUsername(request);
        User user = userRepository.findByUsernameAndStatus(username, true)
                .orElseThrow(() -> new NotFoundException("User not found", "Không tìm thấy người dùng"));
        return ResponseEntity.ok(shiftService.endShift(user, id, endCash));
    }

    // 5. Lấy ca làm việc hiện tại đang mở (Chưa có endTime)
    @GetMapping("/current")
    public ResponseEntity<Shift> getCurrentShift() {
        Shift currentShift = shiftService.getCurrentShift();
        if (currentShift == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(currentShift);
    }

}
