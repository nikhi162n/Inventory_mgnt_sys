package com.inventrack.repository;

import com.inventrack.entity.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface SupplierRepository extends JpaRepository<Supplier, UUID> {
    @Query("SELECT s FROM Supplier s WHERE " +
           "(:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%',:search,'%'))) " +
           "AND (:isActive IS NULL OR s.isActive = :isActive)")
    Page<Supplier> findWithFilters(@Param("search") String search,
                                    @Param("isActive") Boolean isActive,
                                    Pageable pageable);
}
