package com.example.be_restaurant.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class EmptyException extends RuntimeException {
    private  String key;
    private  String message;
}
