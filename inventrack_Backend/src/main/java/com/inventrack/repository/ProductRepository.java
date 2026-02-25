package com.inventrack.repository;

import com.inventrack.entity.Product;
import com.inventrack.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findBySku(String sku);
    boolean existsBySku(String sku);

    @Query("SELECT p FROM Product p WHERE p.isActive = true " +
           "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%',:search,'%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%',:search,'%'))) " +
           "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
           "AND (:supplierId IS NULL OR p.supplier.id = :supplierId) " +
           "AND (:status IS NULL OR p.status = :status)")
    Page<Product> findWithFilters(@Param("search") String search,
                                   @Param("categoryId") UUID categoryId,
                                   @Param("supplierId") UUID supplierId,
                                   @Param("status") ProductStatus status,
                                   Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.status IN (com.inventrack.enums.ProductStatus.LOW_STOCK, com.inventrack.enums.ProductStatus.CRITICAL) AND p.isActive = true")
    List<Product> findLowStockProducts();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.status = :status AND p.isActive = true")
    long countByStatus(@Param("status") ProductStatus status);
    
    @Query("""
    	    SELECT p FROM Product p
    	    WHERE p.isActive = true
    	    AND (:categoryId IS NULL OR p.category.id = :categoryId)
    	""")
    	List<Product> findActiveProducts(UUID categoryId);
}
