package com.example.be_restaurant.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "shift_summary")
@NoArgsConstructor
public class ShiftSummary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "total_before")
    private Double totalBefore;

    @Column(name = "total_discount")
    private Double totalDiscount;

    @Column(name = "total_amount")
    private Double totalAmount;

    @Column(name = "total_order")
    private Integer totalOrder;

    @OneToOne
    @JsonIgnore
    @JoinColumn(name = "shift_id", nullable = false)
    private Shift shift;

    @OneToMany(mappedBy = "shiftSummary")
    private List<ShiftSoldItem> shiftSoldItems = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "daily_summary_id")
    private DailySummary dailySummary;
}
