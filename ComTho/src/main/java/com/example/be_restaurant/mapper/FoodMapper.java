package com.example.be_restaurant.mapper;

import com.example.be_restaurant.bean.response.FoodResponse;
import com.example.be_restaurant.entity.Food;

public class FoodMapper {
    public static FoodResponse convertToResponse(Food food){
        FoodResponse foodResponse = new FoodResponse();
        foodResponse.setId(food.getId());
        foodResponse.setName(food.getName());
        foodResponse.setPrice(food.getPrice());
        foodResponse.setCanUpSize(food.getCanUpSize());
        foodResponse.setUpSizePrice(food.getUpSizePrice());
        foodResponse.setCategoryId(food.getCategory().getId());
        return foodResponse;
    }
}
