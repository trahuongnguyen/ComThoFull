package com.example.be_restaurant.service;

import com.example.be_restaurant.entity.Topping;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface ToppingService {
    List<Topping> getAllToppings();
    Topping getToppingById(Long id);
    Topping createTopping(Topping topping, String username);
    Topping updateTopping(Long id, Topping topping, String username);
    Topping deleteTopping(Long id, String username);
}
