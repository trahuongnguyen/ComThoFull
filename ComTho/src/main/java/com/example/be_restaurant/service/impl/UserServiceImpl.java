package com.example.be_restaurant.service.impl;

import com.example.be_restaurant.bean.response.UserResponse;
import com.example.be_restaurant.entity.User;
import com.example.be_restaurant.exception.AlreadyExistException;
import com.example.be_restaurant.exception.NotFoundException;
import com.example.be_restaurant.mapper.UserMapper;
import com.example.be_restaurant.repository.UserRepository;
import com.example.be_restaurant.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserResponse getUser(String username) {
        return UserMapper.convertToUserResponse(userRepository.findByUsernameAndStatus(username, true)
                .orElseThrow(() -> new NotFoundException("username", "khong tim thay")));
    }

    @Override
    public List<UserResponse> getListUser() {
        return userRepository.findAll().stream().map(UserMapper::convertToUserResponse).collect(Collectors.toList());
    }

    @Override
    public UserResponse createUser(User user) {
        User existUser = userRepository.findByUsernameAndStatus(user.getUsername(), true).orElseThrow(() -> new NotFoundException("NotFound", "Khong tim thay user"));
        if (existUser != null){
            throw new AlreadyExistException("Exist", "User da ton tai");
        }
        User newUser = new User();
        newUser.setUsername(user.getUsername());
        newUser.setFullName(user.getFullName());
        newUser.setRole(User.Role.EMPLOYEE);
        newUser.setStatus(true);
        newUser.setPassword(passwordEncoder.encode("123456678"));
        return UserMapper.convertToUserResponse(userRepository.save(newUser));
    }

    @Override
    public UserResponse updateUser(Long id, User user) {
        User existUser = userRepository.findByUsernameAndStatus(user.getUsername(), true).orElseThrow(() -> new NotFoundException("NotFound", "Khong tim thay user"));
        if (existUser != null && !Objects.equals(existUser.getId(), id)){
            throw new AlreadyExistException("Exist", "User da ton tai");
        }
        User updateUser = userRepository.findByIdAndStatus(id, true).orElseThrow(() -> new NotFoundException("NotFound", "Khong tim thay user"));
        updateUser.setFullName(user.getFullName());
        updateUser.setPassword(passwordEncoder.encode(user.getPassword()));
        return UserMapper.convertToUserResponse(userRepository.save(updateUser));
    }

    @Override
    public void deleteUser(Long id) {
        User updateUser = userRepository.findByIdAndStatus(id, true).orElseThrow(() -> new NotFoundException("NotFound", "Khong tim thay user"));
        updateUser.setStatus(false);
        userRepository.save(updateUser);
    }
}
