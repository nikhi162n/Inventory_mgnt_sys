package com.inventrack.repository;

import com.inventrack.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {
    Optional<Category> findBySlug(String slug);
    List<Category> findByParentIsNull();
    boolean existsByName(String name);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.category.id = :id")
    long countProductsByCategoryId(UUID id);
}
