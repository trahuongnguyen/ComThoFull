package com.example.be_restaurant.service;

import com.example.be_restaurant.bean.request.FoodRequest;
import com.example.be_restaurant.bean.response.FoodResponse;
import com.example.be_restaurant.entity.Food;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface FoodService {
    List<Food> getAllFoodsByCategory(Long categoryId);
    Food getFoodById(Long id);
    Food createFood(FoodRequest food, String username);
    Food updateFood(Long id, FoodRequest food, String username);
    Food deleteFood(Long id, String username);
    List<FoodResponse> getAll();
}
