package com.example.be_restaurant.repository;

import com.example.be_restaurant.entity.ShiftSoldItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShiftSoldItemRepository extends JpaRepository<ShiftSoldItem, Long> {
}
