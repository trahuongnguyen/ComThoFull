package com.example.be_restaurant.repository;

import com.example.be_restaurant.entity.ShiftSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShiftSummaryRepository extends JpaRepository<ShiftSummary, Long> {
}
