package com.example.be_restaurant.controller;

import com.example.be_restaurant.bean.request.FoodRequest;
import com.example.be_restaurant.bean.response.FoodResponse;
import com.example.be_restaurant.entity.Food;
import com.example.be_restaurant.service.FoodService;
import com.example.be_restaurant.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/foods")
public class FoodController{
    private final FoodService foodService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public List<FoodResponse> getAllFoodsWithoutCategory() {
        return foodService.getAll();
    }

    @GetMapping("/category/{id}")
    public List<Food> getAllFoods(@PathVariable(value = "id", required = false) Long categoryId) {
        return foodService.getAllFoodsByCategory(categoryId);
    }

    @GetMapping("/getOne/{id}")
    public Food getFoodById(@PathVariable("id") Long id) {
        return foodService.getFoodById(id);
    }

    @PostMapping
    public Food createFood(@RequestBody FoodRequest food, HttpServletRequest request) {
        String username = jwtUtil.getCurrentUsername(request);
        return foodService.createFood(food, username);
    }

    @PutMapping("/{id}")
    public Food updateFood(@PathVariable("id") Long id, @RequestBody FoodRequest food, HttpServletRequest request) {
        String username = jwtUtil.getCurrentUsername(request);
        return foodService.updateFood(id, food, username);
    }

    @DeleteMapping("/{id}")
    public Food deleteFood(@PathVariable("id") Long id, HttpServletRequest request) {
        String username = jwtUtil.getCurrentUsername(request);
        return foodService.deleteFood(id, username);
    }
}
