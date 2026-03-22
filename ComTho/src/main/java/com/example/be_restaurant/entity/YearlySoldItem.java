package com.example.be_restaurant.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "yearly_sold_item")
@NoArgsConstructor
public class YearlySoldItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "yearly_summary_id", nullable = false)
    private YearlySummary yearlySummary;

    @Column(name = "food", nullable = false)
    private String food;

    @Column(name = "quantity")
    private Long quantity;

    @Column(name = "amount")
    private Double amount;

    @Column(name = "discount")
    private Double discount;
}