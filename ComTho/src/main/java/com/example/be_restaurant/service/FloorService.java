package com.example.be_restaurant.service;

import com.example.be_restaurant.entity.Floor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface FloorService {
    List<Floor> getAllFloors();
    Floor getFloorById(Long id);
    Floor createFloor(Floor floor, String username);
    Floor updateFloor(Long id, Floor floor, String username);
    Floor deleteFloor(Long id, String username);
}
