package com.example.be_restaurant;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.util.TimeZone;

@RequiredArgsConstructor
@SpringBootApplication
public class BeRestaurantApplication {

    public static void main(String[] args) {
        // Set default timezone to UTC+7 (Asia/Ho_Chi_Minh)
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        SpringApplication.run(BeRestaurantApplication.class, args);
    }

}
