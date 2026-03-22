package com.example.be_restaurant.service;

import com.example.be_restaurant.bean.request.DeskRequest;
import com.example.be_restaurant.bean.response.DeskResponse;
import com.example.be_restaurant.entity.Desk;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface DeskService {
    List<Desk> getAllDesksByFloorId(Long floorId);
    Desk getDeskById(Long id);
    Desk createDesk(DeskRequest desk, String username);
    Desk updateDesk(Long id, DeskRequest desk, String username);
    Desk deleteDesk(Long id, String username);
    List<DeskResponse> getAll();
    void updateStatus(Long deskId, String status);
}
