package com.example.be_restaurant.service.impl;

import com.example.be_restaurant.bean.response.ShiftDetailResponse;
import com.example.be_restaurant.entity.*;
import com.example.be_restaurant.repository.ShiftRepository;
import com.example.be_restaurant.repository.ShiftSoldItemRepository;
import com.example.be_restaurant.repository.ShiftSummaryRepository;
import com.example.be_restaurant.service.ShiftService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
@Service
@RequiredArgsConstructor
public class ShiftServiceImpl implements ShiftService {
    private final ShiftRepository shiftRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private final ShiftSummaryRepository shiftSummaryRepository;
    private final ShiftSoldItemRepository shiftSoldItemRepository;

    @Override
    public Page<Shift> getAllShifts(String timeRange, int pageNumber, int pageSize) {
        LocalDateTime start = calculateStartDate(timeRange);
        LocalDateTime end = LocalDateTime.now();

        // CHÍNH TẠI ĐÂY: Sắp xếp record mới nhất lên đầu
        Pageable pageable = PageRequest.of(
                pageNumber,
                pageSize,
                Sort.by("start_time").descending() // DESC để mới nhất (thời gian lớn nhất) lên đầu
        );

        return shiftRepository.findByStartTimeBetweenNative(start, end, pageable);
    }

    @Override
    public ShiftDetailResponse getShiftById(Long shiftId) {
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ca làm việc"));

        Set<Bill> bills = shift.getBills();
        ShiftDetailResponse response = new ShiftDetailResponse();

        // Gán thông tin cơ bản
        response.setShiftId(shift.getId());
        response.setStartTime(shift.getStartTime());
        response.setEndTime(shift.getEndTime());
        response.setStartCash(shift.getStartCash());
        response.setEndCash(shift.getEndCash());

        Map<String, ShiftDetailResponse.ProductSummary> productMap = new HashMap<>();
        double totalRevenue = 0;
        double totalDiscount = 0;
        int totalProductQuantity = 0; // Biến đếm tổng số lượng món

        for (Bill bill : bills) {
            totalRevenue += (bill.getTotalAmount() != null ? bill.getTotalAmount() : 0);
            totalDiscount += (bill.getTotalDiscount() != null ? bill.getTotalDiscount() : 0);

            if (bill.getOrder() != null && bill.getOrder().getOrderDetails() != null) {
                for (OrderDetail detail : bill.getOrder().getOrderDetails()) {
                    String foodName = detail.getFood();
                    int qty = detail.getQuantity();

                    // Cộng dồn vào tổng số lượng bán ra của cả ca
                    totalProductQuantity += qty;

                    ShiftDetailResponse.ProductSummary summary = productMap.getOrDefault(foodName,
                            new ShiftDetailResponse.ProductSummary(foodName, 0, 0.0));

                    summary.setQuantity(summary.getQuantity() + qty);
                    summary.setTotal(summary.getTotal() + detail.getAmount());
                    productMap.put(foodName, summary);
                }
            }
        }

        response.setTotalRevenue(totalRevenue);
        response.setTotalProductQuantity(totalProductQuantity); // Trả về tổng số lượng món

        // Map sản phẩm, khuyến mãi, thanh toán... (giữ nguyên logic cũ)
        response.setProducts(new ArrayList<>(productMap.values()));
        Map<String, ShiftDetailResponse.PromotionSummary> promotionMap = new HashMap<>();

        for (Bill bill : bills) {
            if (bill.getTotalDiscount() != null && bill.getTotalDiscount() > 0) {

                String promoName = "Khuyến mãi"; // nếu sau này có bảng promotion thì đổi
                ShiftDetailResponse.PromotionSummary promo =
                        promotionMap.getOrDefault(promoName,
                                new ShiftDetailResponse.PromotionSummary(promoName, 0, 0.0));

                promo.setQuantity(promo.getQuantity() + 1);
                promo.setTotal(promo.getTotal() + bill.getTotalDiscount());

                promotionMap.put(promoName, promo);
            }
        }
        response.setPromotions(new ArrayList<>(promotionMap.values()));

        Map<String, ShiftDetailResponse.PaymentSummary> paymentMap = new HashMap<>();

        for (Bill bill : bills) {
            if (bill.getPayment() != null) {
                String method = bill.getPayment().name();

                ShiftDetailResponse.PaymentSummary payment =
                        paymentMap.getOrDefault(method,
                                new ShiftDetailResponse.PaymentSummary(method, 0, 0.0));

                payment.setCount(payment.getCount() + 1);
                payment.setTotal(payment.getTotal() +
                        (bill.getTotalAmount() != null ? bill.getTotalAmount() : 0));

                paymentMap.put(method, payment);
            }
        }

        response.setPayments(new ArrayList<>(paymentMap.values()));


        return response;
    }

    @Override
    public Shift startShift(User user, Double startCash) {
        Shift shift = new Shift();
        shift.setUser(user);
        shift.setStartCash(startCash);
        shift.setEndCash(startCash);
        shift.setCreatedBy(user.getUsername());
        return shiftRepository.save(shift);
    }

    @Override
    @Transactional
    public Shift endShift(User user, Long shiftId, double endCash) {
        // 1. Tìm và cập nhật thông tin kết thúc Ca
        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy ca làm việc"));

        shift.setEndTime(LocalDateTime.now());
        shift.setEndCash(endCash);
        shift.setUser(user);
        shift.setUpdatedBy(user.getUsername());

        // 2. Khởi tạo các biến tổng hợp cho ShiftSummary
        double totalBefore = 0.0;
        double totalDiscount = 0.0;
        double totalAmount = 0.0;
        int totalOrder = 0;

        // Map để gộp các món ăn giống nhau (ShiftSoldItem)
        Map<String, ShiftSoldItem> soldItemMap = new HashMap<>();

        Set<Bill> bills = shift.getBills();
        if (bills != null) {
            totalOrder = bills.size();
            for (Bill bill : bills) {
                totalBefore += (bill.getTotalBefore() != null ? bill.getTotalBefore() : 0.0);
                totalDiscount += (bill.getTotalDiscount() != null ? bill.getTotalDiscount() : 0.0);
                totalAmount += (bill.getTotalAmount() != null ? bill.getTotalAmount() : 0.0);

                // Truy xuất chi tiết món ăn từ Order liên kết với Bill
                if (bill.getOrder() != null && bill.getOrder().getOrderDetails() != null) {
                    for (OrderDetail detail : bill.getOrder().getOrderDetails()) {
                        String foodName = detail.getFood();

                        ShiftSoldItem soldItem = soldItemMap.getOrDefault(foodName, new ShiftSoldItem());
                        soldItem.setFood(foodName);
                        soldItem.setQuantity((soldItem.getQuantity() != null ? soldItem.getQuantity() : 0) + detail.getQuantity());
                        soldItem.setAmount((soldItem.getAmount() != null ? soldItem.getAmount() : 0.0) + detail.getAmount());
                        // Nếu detail có discount riêng lẻ, cộng dồn tại đây (hiện tại entity OrderDetail chưa có field discount)
                        soldItem.setDiscount(0.0);

                        soldItemMap.put(foodName, soldItem);
                    }
                }
            }
        }

        // 3. Lưu ShiftSummary
        ShiftSummary summary = new ShiftSummary();
        summary.setShift(shift);
        summary.setTotalBefore(totalBefore);
        summary.setTotalDiscount(totalDiscount);
        summary.setTotalAmount(totalAmount);
        summary.setTotalOrder(totalOrder);

        ShiftSummary savedSummary = shiftSummaryRepository.save(summary);

        // 4. Lưu danh sách ShiftSoldItem
        List<ShiftSoldItem> soldItems = new ArrayList<>();
        for (ShiftSoldItem item : soldItemMap.values()) {
            item.setShiftSummary(savedSummary);
            soldItems.add(item);
        }
        shiftSoldItemRepository.saveAll(soldItems);

        // Gán ngược lại summary cho shift để trả về response đầy đủ nếu cần
        shift.setShiftSummary(savedSummary);

        return shiftRepository.save(shift);
    }

    @Override
    public Shift getCurrentShift() {
        return shiftRepository.findByEndTime(null).orElse(null);
    }
    private LocalDateTime calculateStartDate(String timeRange) {
        return switch (timeRange) {
            case "7" -> LocalDateTime.now().minusDays(7);
            case "30" -> LocalDateTime.now().minusDays(30);
            default -> LocalDateTime.now().minusDays(1);
        };
    }
}
