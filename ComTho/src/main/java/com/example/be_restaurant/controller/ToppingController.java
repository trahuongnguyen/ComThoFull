package com.example.be_restaurant.controller;

import com.example.be_restaurant.entity.Topping;
import com.example.be_restaurant.service.ToppingService;
import com.example.be_restaurant.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/toppings")
public class ToppingController {
    private final ToppingService toppingService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public List<Topping> getAllToppings() {
        return toppingService.getAllToppings();
    }

    @GetMapping("/{id}")
    public Topping getToppingById(@PathVariable("id") Long id) {
        return toppingService.getToppingById(id);
    }

    @PostMapping
    public Topping createTopping(@RequestBody Topping topping, HttpServletRequest httpServletRequest) {
        String username = jwtUtil.getCurrentUsername(httpServletRequest);
        return toppingService.createTopping(topping, username);
    }

    @PutMapping("/{id}")
    public Topping updateTopping(@PathVariable("id") Long id, @RequestBody Topping topping, HttpServletRequest httpServletRequest){
        String username = jwtUtil.getCurrentUsername(httpServletRequest);
        return toppingService.updateTopping(id, topping, username);
    }

    @DeleteMapping("/{id}")
    public Topping deleteTopping(@PathVariable("id") Long id, HttpServletRequest httpServletRequest){
        String username = jwtUtil.getCurrentUsername(httpServletRequest);
        return toppingService.deleteTopping(id, username);
    }

}
