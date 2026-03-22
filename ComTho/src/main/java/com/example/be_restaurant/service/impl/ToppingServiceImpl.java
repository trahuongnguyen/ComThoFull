package com.example.be_restaurant.service.impl;

import com.example.be_restaurant.entity.Topping;
import com.example.be_restaurant.exception.AlreadyExistException;
import com.example.be_restaurant.exception.NotFoundException;
import com.example.be_restaurant.repository.ToppingRepository;
import com.example.be_restaurant.service.ToppingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ToppingServiceImpl implements ToppingService {
    private final ToppingRepository toppingRepository;

    @Override
    public List<Topping> getAllToppings() {
        return toppingRepository.findAllByStatus(true);
    }

    @Override
    public Topping getToppingById(Long id) {
        return toppingRepository.findByIdAndStatus(id, true).orElseThrow(() -> new NotFoundException("Topping","Không tìm thấy topping với id: " + id));
    }

    @Override
    public Topping createTopping(Topping topping, String username) {
        Topping existingTopping = toppingRepository.findByNameAndStatus(topping.getName(), true).orElse(null);
        if (existingTopping != null) {
            throw new AlreadyExistException("Topping", "Topping đã tồn tại với tên: " + topping.getName());
        }
        Topping newTopping = new Topping();
        newTopping.setName(topping.getName());
        newTopping.setPrice(topping.getPrice());
        newTopping.setStatus(true);
        newTopping.setCreatedBy(username);
        return toppingRepository.save(newTopping);
    }

    @Override
    public Topping updateTopping(Long id, Topping topping, String username) {
        Topping existingTopping = toppingRepository.findByNameAndStatus(topping.getName(), true).orElse(null);
        if (existingTopping != null && !existingTopping.getId().equals(id)) {
            throw new AlreadyExistException("Topping", "Topping đã tồn tại với tên: " + topping.getName());
        }
         Topping updatedTopping = toppingRepository.findByIdAndStatus(id, true)
                .orElseThrow(() -> new NotFoundException("Topping","Không tìm thấy topping với id: " + id));
        updatedTopping.setName(topping.getName());
        updatedTopping.setPrice(topping.getPrice());
        updatedTopping.setUpdatedBy(username);
        return toppingRepository.save(updatedTopping);
    }

    @Override
    public Topping deleteTopping(Long id, String username) {
        Topping existingTopping = toppingRepository.findByIdAndStatus(id, true)
                .orElseThrow(() -> new NotFoundException("Topping","Không tìm thấy topping với id: " + id));
        existingTopping.setStatus(false);
        existingTopping.setUpdatedBy(username);
        return toppingRepository.save(existingTopping);
    }
}
