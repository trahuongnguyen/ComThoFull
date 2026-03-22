package com.example.be_restaurant.service.impl;

import com.example.be_restaurant.bean.request.FoodRequest;
import com.example.be_restaurant.bean.response.FoodResponse;
import com.example.be_restaurant.entity.Category;
import com.example.be_restaurant.entity.Food;
import com.example.be_restaurant.exception.AlreadyExistException;
import com.example.be_restaurant.exception.NotFoundException;
import com.example.be_restaurant.mapper.FoodMapper;
import com.example.be_restaurant.repository.CategoryRepository;
import com.example.be_restaurant.repository.FoodRepository;
import com.example.be_restaurant.service.FoodService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FoodServiceImpl implements FoodService {
    private final FoodRepository foodRepository;
    private final CategoryRepository categoryRepository;
    @Override
    public List<Food> getAllFoodsByCategory(Long categoryId) {
        Category category = categoryRepository.findByIdAndStatus(categoryId, true)
                .orElseThrow(() -> new NotFoundException("NotFound", "Không tìm thấy danh mục với id: " + categoryId));
        List<Food> foods = new ArrayList<>();
        foods = category == null ? foodRepository.findAll() : foodRepository.findByCategoryAndStatus(category, true);
        return foods;
    }

    @Override
    public Food getFoodById(Long id) {
        return foodRepository.findByIdAndStatus(id, true)
                .orElseThrow(() -> new NotFoundException("NotFound", "Không tìm thấy món ăn với id: " + id));
    }

    @Override
    public Food createFood(FoodRequest food, String username) {
        boolean isExist = foodRepository.existsByNameAndStatus(food.getName(), true);
        if (isExist) {
            throw new AlreadyExistException("Exist", "Món ăn đã tồn tại: " + food.getName());
        }
        Food newFood = new Food();
        newFood.setName(food.getName());
        newFood.setPrice(food.getPrice());
        newFood.setStatus(true);
        newFood.setCreatedBy(username);
        newFood.setCanUpSize(food.getCanUpSize());
        newFood.setUpSizePrice(
                food.getUpSizePrice() != null ? food.getUpSizePrice() : 0
        );
        Category category = categoryRepository.findByIdAndStatus(food.getCategoryId(), true)
                .orElseThrow(() -> new NotFoundException("NotFound", "Không tìm thấy danh mục với id: " + food.getCategoryId()));
        newFood.setCategory(category);
        return foodRepository.save(newFood);
    }

    @Override
    public Food updateFood(Long id, FoodRequest food, String username) {
        Food existingFood = foodRepository.findByNameAndStatus(food.getName(), true)
                .orElse(null);
        if (existingFood != null && !existingFood.getId().equals(id)) {
            throw new AlreadyExistException("Exist", "Món ăn đã tồn tại: " + food.getName());
        }
         Food updatedFood = foodRepository.findByIdAndStatus(id, true)
                .orElseThrow(() -> new NotFoundException("NotFound", "Không tìm thấy món ăn với id: " + id));
        updatedFood.setName(food.getName());
        updatedFood.setPrice(food.getPrice());
        updatedFood.setCanUpSize(food.getCanUpSize());
        updatedFood.setUpSizePrice(food.getUpSizePrice() != null ? food.getUpSizePrice() : 0);
        updatedFood.setUpdatedBy(username);
        Category category = categoryRepository.findByIdAndStatus(food.getCategoryId(), true)
                .orElseThrow(() -> new NotFoundException("NotFound", "Không tìm thấy danh mục với id: " + food.getCategoryId()));
        updatedFood.setCategory(category);
        return foodRepository.save(updatedFood);
    }

    @Override
    public Food deleteFood(Long id, String username) {
        Food updatedFood = foodRepository.findByIdAndStatus(id, true)
                .orElseThrow(() -> new NotFoundException("NotFound", "Không tìm thấy món ăn với id: " + id));
        updatedFood.setStatus(false);
        updatedFood.setUpdatedBy(username);
        return foodRepository.save(updatedFood);
    }

    @Override
    public List<FoodResponse> getAll() {
        return foodRepository.findAllByStatus(true)
                .stream()
                .filter(c -> c.getCategory().isStatus())
                .map(FoodMapper::convertToResponse)
                .collect(Collectors.toList());
    }
}
