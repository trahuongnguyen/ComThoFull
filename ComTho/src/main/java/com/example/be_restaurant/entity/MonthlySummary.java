package com.example.be_restaurant.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "monthly_summary")
@NoArgsConstructor
public class MonthlySummary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "month", nullable = false)
    private String yearMonth;

    @Column(name = "total_before")
    private Double totalBefore;

    @Column(name = "total_discount")
    private Double totalDiscount;

    @Column(name = "total_amount")
    private Double totalAmount;

    @Column(name = "total_order")
    private Integer totalOrder;

    @OneToMany(mappedBy = "monthlySummary", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DailySummary> dailySummaries = new ArrayList<>();

    @OneToMany(mappedBy = "monthlySummary", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MonthlySoldItem> soldItems = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "yearly_summary_id")
    private YearlySummary yearlySummary;
}