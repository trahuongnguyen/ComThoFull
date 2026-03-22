package com.example.be_restaurant.controller;

import com.example.be_restaurant.entity.Category;
import com.example.be_restaurant.service.CategoryService;
import com.example.be_restaurant.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/categories")
@Slf4j
public class CategoryController{
    private final CategoryService categoryService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public List<Category> getAllCategories() {
        return categoryService.getAllCategories();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(categoryService.getCategoryById(id));
    }

    @PostMapping
    public ResponseEntity<Category> createCategory(@RequestBody Category category, HttpServletRequest request) {
        String username = jwtUtil.getCurrentUsername(request);
        return ResponseEntity.ok(categoryService.createCategory(category, username));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Category> updateCategory(@PathVariable("id") Long id, @RequestBody Category category, HttpServletRequest request) {
        String username = jwtUtil.getCurrentUsername(request);
        return ResponseEntity.ok(categoryService.updateCategory(id, category, username));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Category> deleteCategory(@PathVariable("id") Long id, HttpServletRequest request) {
        String username = jwtUtil.getCurrentUsername(request);
        return ResponseEntity.ok(categoryService.deleteCategory(id, username));
    }
}
