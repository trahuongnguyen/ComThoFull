package com.example.be_restaurant.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
@Data
@Entity
@Table(name = "orders_temp")
@NoArgsConstructor
public class OrderTemp extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "desk_id")
    private Long deskId;

    @Column(name = "discount")
    private Double discount;

    @Column(name = "note")
    private String note;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "orders", columnDefinition = "TEXT")
    private String orders;

}
