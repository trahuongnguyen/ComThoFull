package com.example.be_restaurant.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "daily_summary")
@NoArgsConstructor
public class DailySummary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "total_before")
    private Double totalBefore;

    @Column(name = "total_discount")
    private Double totalDiscount;

    @Column(name = "total_amount")
    private Double totalAmount;

    @Column(name = "total_order")
    private Integer totalOrder;

    @OneToMany(mappedBy = "dailySummary", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ShiftSummary> shiftSummaries = new ArrayList<>();

    @OneToMany(mappedBy = "dailySummary", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DailySoldItem> soldItems = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "monthly_summary_id")
    private MonthlySummary monthlySummary;
}