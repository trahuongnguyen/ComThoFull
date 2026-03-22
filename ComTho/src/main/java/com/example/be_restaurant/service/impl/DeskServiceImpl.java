package com.example.be_restaurant.service.impl;

import com.example.be_restaurant.bean.request.DeskRequest;
import com.example.be_restaurant.bean.response.DeskResponse;
import com.example.be_restaurant.entity.Desk;
import com.example.be_restaurant.entity.Floor;
import com.example.be_restaurant.exception.NotFoundException;
import com.example.be_restaurant.mapper.DeskMapper;
import com.example.be_restaurant.repository.DeskRepository;
import com.example.be_restaurant.repository.FloorRepository;
import com.example.be_restaurant.service.DeskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DeskServiceImpl implements DeskService {
    private final DeskRepository deskRepository;
    private final FloorRepository floorRepository;

    @Override
    public List<Desk> getAllDesksByFloorId(Long floorId) {
        Floor floor = floorRepository.findByIdAndStatus(floorId, true).orElseThrow(() -> new NotFoundException("Floor", "Không tìm thấy tầng với id: " + floorId));
        List<Desk> desks = new ArrayList<>();
        desks = floorId == null ? deskRepository.findAll() : deskRepository.findByFloorAndStatus(floor, true);
        return desks;
    }

    @Override
    public Desk getDeskById(Long id) {
        return deskRepository.findByIdAndStatus(id, true).orElseThrow(() -> new NotFoundException("Desk", "Không tìm thấy bàn với id: " + id));
    }

    @Override
    public Desk createDesk(DeskRequest desk, String username) {
        Boolean exists = deskRepository.existsByNameAndStatus(desk.getName(), true);
        if (exists) {
            throw new NotFoundException("Exist", "Bàn đã tồn tại: " + desk.getName());
        }
        Desk newDesk = new Desk();
        newDesk.setName(desk.getName());
        Floor floor = floorRepository.findByIdAndStatus(desk.getFloorId(), true).orElseThrow(() -> new NotFoundException("Floor", "Không tìm thấy tầng với id: " + desk.getFloorId()));
        newDesk.setFloor(floor);
        newDesk.setStatus(true);
        newDesk.setCurrentStatus(Desk.DeskStatus.AVAILABLE);
        newDesk.setCapacity(desk.getCapacity());
        newDesk.setCreatedBy(username);
        return deskRepository.save(newDesk);
    }

    @Override
    public Desk updateDesk(Long id, DeskRequest desk, String username) {
        Desk existingDesk = deskRepository.findByNameAndStatus(desk.getName(), true)
                .orElseThrow(() -> new NotFoundException("Desk", "Không tìm thấy bàn với id: " + id));
        if (existingDesk != null && !existingDesk.getId().equals(id)) {
            throw new NotFoundException("Exist", "Bàn đã tồn tại: " + desk.getName());
        }
        Desk updatedDesk = deskRepository.findByIdAndStatus(id, true)
                .orElseThrow(() -> new NotFoundException("Desk", "Không tìm thấy bàn với id: " + id));
        updatedDesk.setName(desk.getName());
        Floor floor = floorRepository.findByIdAndStatus(desk.getFloorId(), true).orElseThrow(() -> new NotFoundException("Floor", "Không tìm thấy tầng với id: " + desk.getFloorId()));
        updatedDesk.setFloor(floor);
        updatedDesk.setUpdatedBy(username);
        updatedDesk.setCapacity(desk.getCapacity());
        return deskRepository.save(updatedDesk);
    }

    @Override
    public Desk deleteDesk(Long id, String username) {
        Desk existingDesk = deskRepository.findByIdAndStatus(id, true)
                .orElseThrow(() -> new NotFoundException("Desk", "Không tìm thấy bàn với id: " + id));
        existingDesk.setStatus(false);
        existingDesk.setUpdatedBy(username);
        return deskRepository.save(existingDesk);
    }

    @Override
    public List<DeskResponse> getAll() {
        return deskRepository.findAllByStatus(true).stream().map(DeskMapper::toDeskResponse).toList();
    }

    @Override
    public void updateStatus(Long deskId, String status) {
        Desk existingDesk = deskRepository.findByIdAndStatus(deskId, true)
                .orElseThrow(() -> new NotFoundException("Desk", "Không tìm thấy bàn với id: " + deskId));
        if (status.equalsIgnoreCase("ordering")){
            existingDesk.setCurrentStatus(Desk.DeskStatus.ORDERING);
        }else{
            existingDesk.setCurrentStatus(Desk.DeskStatus.AVAILABLE);
        }
        deskRepository.save(existingDesk);
    }
}
