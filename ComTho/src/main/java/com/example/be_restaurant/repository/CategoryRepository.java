package com.example.be_restaurant.repository;

import com.example.be_restaurant.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> getAllByStatus(boolean status);
    Optional<Category> findByIdAndStatus(Long id, boolean status);
    boolean existsByNameAndStatus(String name, boolean status);
    Optional<Category> findByNameAndStatus(String name, boolean status);
}
