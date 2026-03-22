package com.example.be_restaurant.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Table(name = "monthly_sold_item")
@NoArgsConstructor
public class MonthlySoldItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "monthly_summary_id", nullable = false)
    private MonthlySummary monthlySummary;

    @Column(name = "food", nullable = false)
    private String food;

    @Column(name = "quantity")
    private Long quantity;

    @Column(name = "amount")
    private Double amount;

    @Column(name = "discount")
    private Double discount;
}