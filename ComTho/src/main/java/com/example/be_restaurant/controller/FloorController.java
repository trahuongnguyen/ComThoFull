package com.example.be_restaurant.controller;

import com.example.be_restaurant.entity.Floor;
import com.example.be_restaurant.service.FloorService;
import com.example.be_restaurant.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/floors")
public class FloorController {
    private final FloorService floorService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public List<Floor> getAllFloors() {
        return floorService.getAllFloors();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Floor> getFloorById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(floorService.getFloorById(id));
    }

    @PostMapping
    public ResponseEntity<Floor> createFloor(@RequestBody Floor floor, HttpServletRequest request) {
        String username = jwtUtil.getCurrentUsername(request);
        return ResponseEntity.ok(floorService.createFloor(floor, username));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Floor> updateFloor(@PathVariable("id") Long id, @RequestBody Floor floor, HttpServletRequest request) {
        String username = jwtUtil.getCurrentUsername(request);
        return ResponseEntity.ok(floorService.updateFloor(id, floor, username));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Floor> deleteFloor(@PathVariable("id") Long id, HttpServletRequest request) {
        String username = jwtUtil.getCurrentUsername(request);
        return ResponseEntity.ok(floorService.deleteFloor(id, username));
    }
}
