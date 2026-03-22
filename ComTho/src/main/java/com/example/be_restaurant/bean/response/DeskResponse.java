package com.example.be_restaurant.bean.response;

import lombok.Data;

@Data
public class DeskResponse {
    private Long id;
    private String name;
    private Long floorId;
    private String floorName;
    private Integer capacity;
    private String currentStatus;
}
