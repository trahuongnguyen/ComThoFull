package com.example.be_restaurant.repository;

import com.example.be_restaurant.entity.OrderTemp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderTempRepository extends JpaRepository<OrderTemp, Long> {
    void deleteByDeskId(Long deskId);
    List<OrderTemp> findAllByDeskId(Long deskId);
}
