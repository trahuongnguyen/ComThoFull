package com.example.be_restaurant.repository;

import com.example.be_restaurant.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsernameAndStatus(String username, boolean status);
    Optional<User> findByIdAndStatus(Long id, boolean status);
}
