package com.example.be_restaurant.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Set;

@Data
@Entity
@Table(name = "yearly_summary")
@NoArgsConstructor
public class YearlySummary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "year", nullable = false)
    private Integer year;

    @Column(name = "total_before")
    private Double totalBefore;

    @Column(name = "total_discount")
    private Double totalDiscount;

    @Column(name = "total_amount")
    private Double totalAmount;

    @Column(name = "total_order")
    private Integer totalOrder;

    @OneToMany(mappedBy = "yearlySummary", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<MonthlySummary> monthlySummaries;

    @OneToMany(mappedBy = "yearlySummary", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<YearlySoldItem> soldItems;
}
