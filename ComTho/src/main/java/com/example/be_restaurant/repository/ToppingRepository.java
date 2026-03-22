package com.example.be_restaurant.repository;

import com.example.be_restaurant.entity.Topping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ToppingRepository extends JpaRepository<Topping, Long> {
    List<Topping> findAllByStatus(Boolean status);
    Optional<Topping> findByIdAndStatus(Long id, Boolean status);
    Optional<Topping> findByNameAndStatus(String name, Boolean status);
}
