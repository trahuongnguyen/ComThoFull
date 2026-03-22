package com.example.be_restaurant.repository;

import com.example.be_restaurant.entity.Desk;
import com.example.be_restaurant.entity.Floor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeskRepository extends JpaRepository<Desk, Long> {
    List<Desk> findByFloorAndStatus(Floor floor, Boolean status);
    Optional<Desk> findByIdAndStatus(Long id, Boolean status);
    Boolean existsByNameAndStatus(String name, Boolean status);
    Optional<Desk> findByNameAndStatus(String name, Boolean status);
    List<Desk> findAllByStatus(boolean status);
    boolean existsByNameAndFloorAndStatus(String name, Floor floor, boolean status);
}
