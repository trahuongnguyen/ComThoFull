package com.example.be_restaurant.controller;

import com.example.be_restaurant.bean.request.DeskRequest;
import com.example.be_restaurant.bean.response.DeskResponse;
import com.example.be_restaurant.entity.Desk;
import com.example.be_restaurant.service.DeskService;
import com.example.be_restaurant.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/desks")
public class DeskController {
    private final DeskService deskService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public List<DeskResponse> getAll(){
        return deskService.getAll();
    }

    @GetMapping("/floor/{id}")
    public List<Desk> getAllDesks(@PathVariable(required = false) Long id) {
        return deskService.getAllDesksByFloorId(id);
    }

    @GetMapping("/getOne/{id}")
    public Desk getDeskById(@PathVariable Long id) {
        return deskService.getDeskById(id);
    }

    @PostMapping
    public Desk createDesk(@RequestBody DeskRequest desk, HttpServletRequest request) {
        String username = jwtUtil.getCurrentUsername(request);
        return deskService.createDesk(desk, username);
    }

    @PutMapping("/{id}")
    public Desk updateDesk(@PathVariable Long id, @RequestBody DeskRequest desk, HttpServletRequest request) {
        String username = jwtUtil.getCurrentUsername(request);
        return deskService.updateDesk(id, desk, username);
    }

    @DeleteMapping("/{id}")
    public Desk deleteDesk(@PathVariable Long id, HttpServletRequest request) {
        String username = jwtUtil.getCurrentUsername(request);
        return deskService.deleteDesk(id, username);
    }

    @PutMapping("/status/{id}")
    public void updateStatus(@PathVariable Long id, @RequestParam String status){
        deskService.updateStatus(id, status);
    }
}
