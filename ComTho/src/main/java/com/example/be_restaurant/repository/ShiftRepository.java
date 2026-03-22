package com.example.be_restaurant.repository;

import com.example.be_restaurant.entity.Shift;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface ShiftRepository extends JpaRepository<Shift, Long> {
    Optional<Shift> findByEndTime(LocalDateTime endTime);
    @Query(value = "SELECT * FROM shift s WHERE s.start_time BETWEEN :start AND :end",
            countQuery = "SELECT count(*) FROM shift s WHERE s.start_time BETWEEN :start AND :end",
            nativeQuery = true)
    Page<Shift> findByStartTimeBetweenNative(
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end,
            Pageable pageable);
}
