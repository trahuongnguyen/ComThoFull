package com.example.be_restaurant.service;

import com.example.be_restaurant.bean.response.ShiftDetailResponse;
import com.example.be_restaurant.entity.Shift;
import com.example.be_restaurant.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

@Service
public interface ShiftService {
    Page<Shift> getAllShifts(String timeRange, int pageNumber, int pageSize);
    ShiftDetailResponse getShiftById(Long shiftId);
    Shift startShift(User user, Double startCash);
    Shift endShift(User user, Long shiftId, double endCash);
    Shift getCurrentShift();
}
