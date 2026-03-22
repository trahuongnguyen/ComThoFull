package com.example.be_restaurant.mapper;

import com.example.be_restaurant.bean.response.UserResponse;
import com.example.be_restaurant.entity.User;

public class UserMapper {
    public static UserResponse convertToUserResponse(User user){
        UserResponse response = new UserResponse();
        response.setUsername(user.getUsername());
        response.setFullName(user.getFullName());
        response.setRole(user.getRole().name());
        return response;
    }
}
