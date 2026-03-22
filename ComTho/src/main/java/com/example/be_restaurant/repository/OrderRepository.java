package com.example.be_restaurant.repository;

import com.example.be_restaurant.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query(
            value = """
            SELECT o.*
            FROM orders o
            JOIN desk d ON o.desk_id = d.id
            WHERE o.desk_id = :deskId
              AND o.current_status = :orderStatus
              AND o.status = :status
              AND d.is_active = true
        """,
            nativeQuery = true
    )
    Order findByDeskAndStatusAndDeskActive(
            @Param("deskId") Long deskId,
            @Param("orderStatus") String orderStatus,
            @Param("status") boolean status
    );
    Optional<Order> findByIdAndStatus(Long id, boolean status);
}
