package com.example.be_restaurant.repository;

import com.example.be_restaurant.entity.Floor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FloorRepository extends JpaRepository<Floor, Long> {
    List<Floor> findByStatus(Boolean status);
    Optional<Floor> findByIdAndStatus(Long id, Boolean status);
    Optional<Floor> findByNameAndStatus(String name, Boolean status);
    Boolean existsByNameAndStatus(String name, Boolean status);
}
