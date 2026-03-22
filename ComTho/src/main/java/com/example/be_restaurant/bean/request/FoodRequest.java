package com.example.be_restaurant.bean.request;

import lombok.*;

@Data
@Getter
@Setter
@NoArgsConstructor
public class FoodRequest {
    private String name;
    private Double price;
    private Long categoryId;
    private Boolean canUpSize;
    private Double upSizePrice;
}
