package com.example.be_restaurant.service;

import com.example.be_restaurant.bean.response.UserResponse;
import com.example.be_restaurant.entity.User;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface UserService {
    UserResponse getUser(String username);
    List<UserResponse> getListUser();
    UserResponse createUser(User user);
    UserResponse updateUser(Long id, User user);
    void deleteUser(Long id);
}
