package com.example.be_restaurant.repository;

import com.example.be_restaurant.entity.Category;
import com.example.be_restaurant.entity.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FoodRepository extends JpaRepository<Food, Long> {
    List<Food> findByCategoryAndStatus(Category category, boolean status);
    Optional<Food> findByIdAndStatus(Long id, boolean status);
    Boolean existsByNameAndStatus(String name, boolean status);
    Optional<Food> findByNameAndStatus(String name, boolean status);
    List<Food> findAllByIdInAndStatus(List<Long> ids, boolean status);
    List<Food> findAllByStatus(boolean status);
    boolean existsByNameAndCategory(String name, Category category);
}
