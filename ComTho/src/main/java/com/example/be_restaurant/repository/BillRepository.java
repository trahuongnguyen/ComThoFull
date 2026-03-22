package com.example.be_restaurant.repository;

import com.example.be_restaurant.entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    @Query("SELECT DISTINCT b FROM Bill b JOIN FETCH b.order o JOIN FETCH o.orderDetails WHERE b.id = :id")
    Optional<Bill> findByIdWithDetails(@Param("id") Long id);

}
