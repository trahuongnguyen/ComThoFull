package com.example.be_restaurant.mapper;

import com.example.be_restaurant.bean.response.DeskResponse;

public class DeskMapper {
    public static DeskResponse toDeskResponse(com.example.be_restaurant.entity.Desk desk) {
        DeskResponse response = new DeskResponse();
        response.setId(desk.getId());
        response.setName(desk.getName());
        response.setFloorId(desk.getFloor().getId());
        response.setFloorName(desk.getFloor().getName());
        response.setCapacity(desk.getCapacity());
        response.setCurrentStatus(desk.getCurrentStatus().name());
        return response;
    }
}
