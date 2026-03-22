package com.example.be_restaurant.service;

import com.example.be_restaurant.entity.Category;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface CategoryService {
    List<Category> getAllCategories();
    Category getCategoryById(Long id);
    Category createCategory(Category category, String username);
    Category updateCategory(Long id, Category category, String username);
    Category deleteCategory(Long id, String username);
}
