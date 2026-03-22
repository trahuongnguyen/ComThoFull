package com.example.be_restaurant.service.impl;

import com.example.be_restaurant.entity.Floor;
import com.example.be_restaurant.exception.AlreadyExistException;
import com.example.be_restaurant.exception.NotFoundException;
import com.example.be_restaurant.repository.FloorRepository;
import com.example.be_restaurant.service.FloorService;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
public class FloorServiceImpl implements FloorService {
    private final FloorRepository floorRepository;

    public FloorServiceImpl(FloorRepository floorRepository) {
        this.floorRepository = floorRepository;
    }

    @Override
    public List<Floor> getAllFloors() {
        return floorRepository.findByStatus(true);
    }

    @Override
    public Floor getFloorById(Long id) {
        return floorRepository.findByIdAndStatus(id, true).orElseThrow(() -> new NotFoundException("Floor", "Không tìm thấy tầng với id: " + id));
    }

    @Override
    public Floor createFloor(Floor floor, String username) {
        boolean exists = floorRepository.existsByNameAndStatus(floor.getName(), true);
        if (exists) {
            throw new AlreadyExistException("Exist", "Tầng đã tồn tại: " + floor.getName());
        }
        Floor newFloor = new Floor();
        newFloor.setName(floor.getName());
        newFloor.setStatus(true);
        newFloor.setCreatedBy(username);
        return floorRepository.save(newFloor);
    }

    @Override
    public Floor updateFloor(Long id, Floor floor, String username) {
        Floor existingFloor = floorRepository.findByNameAndStatus(floor.getName(), true)
                .orElseThrow(() -> new NotFoundException("Floor", "Không tìm thấy tầng với id: " + id));
        if (existingFloor != null && !existingFloor.getId().equals(id)) {
            throw new AlreadyExistException("Exist", "Tầng đã tồn tại: " + floor.getName());
        }
        Floor updatedFloor = floorRepository.findByIdAndStatus(id, true)
                .orElseThrow(() -> new NotFoundException("Floor", "Không tìm thấy tầng với id: " + id));
        updatedFloor.setName(floor.getName());
        updatedFloor.setUpdatedBy(username);
        return floorRepository.save(updatedFloor);
    }

    @Override
    public Floor deleteFloor(Long id, String username) {
        Floor existingFloor = floorRepository.findByIdAndStatus(id, true)
                .orElseThrow(() -> new NotFoundException("Floor", "Không tìm thấy tầng với id: " + id));
        existingFloor.setStatus(false);
        existingFloor.setUpdatedBy(username);
        return floorRepository.save(existingFloor);
    }
}
