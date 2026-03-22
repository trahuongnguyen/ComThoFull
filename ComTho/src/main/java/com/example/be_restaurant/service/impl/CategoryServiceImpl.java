package com.example.be_restaurant.service.impl;

import com.example.be_restaurant.entity.Category;
import com.example.be_restaurant.exception.AlreadyExistException;
import com.example.be_restaurant.exception.NotFoundException;
import com.example.be_restaurant.repository.CategoryRepository;
import com.example.be_restaurant.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {
    private final CategoryRepository categoryRepository;
    @Override
    public List<Category> getAllCategories() {
        return categoryRepository.getAllByStatus(true);
    }

    @Override
    public Category getCategoryById(Long id) {
        return categoryRepository.findByIdAndStatus(id, true)
                .orElseThrow(() -> new NotFoundException("NotFound", "Không tìm thấy danh mục với id: " + id));
    }

    @Override
    public Category createCategory(Category category, String username) {
        boolean isExist = categoryRepository.existsByNameAndStatus(category.getName(), true);
        if (isExist) {
            throw new AlreadyExistException("Exist", "Danh mục đã tồn tại: " + category.getName());
        }
        Category newCategory = new Category();
        newCategory.setName(category.getName());
        newCategory.setStatus(true);
        newCategory.setCreatedBy(username);
        return categoryRepository.save(newCategory);
    }

    @Override
    public Category updateCategory(Long id, Category category, String username) {
        Category existingCategory = categoryRepository.findByNameAndStatus(category.getName(), true)
                .orElse(null);
        Category updatedCategory = categoryRepository.findByIdAndStatus(id, true)
                .orElseThrow(() -> new NotFoundException("NotFound", "Không tìm thấy danh mục với id: " + id));
        if (existingCategory != null && !existingCategory.getId().equals(id)) {
            throw new AlreadyExistException("Exist", "Danh mục đã tồn tại: " + category.getName());
        }
        updatedCategory.setName(category.getName());
        updatedCategory.setUpdatedBy(username);
        return categoryRepository.save(updatedCategory);
    }

    @Override
    public Category deleteCategory(Long id, String username) {
        Category updatedCategory = categoryRepository.findByIdAndStatus(id, true)
                .orElseThrow(() -> new NotFoundException("NotFound", "Không tìm thấy danh mục với id: " + id));
        updatedCategory.setStatus(false);
        updatedCategory.setUpdatedBy(username);
        return categoryRepository.save(updatedCategory);
    }
}
