package com.inventrack.repository;

import com.inventrack.entity.StockMovement;
import com.inventrack.enums.MovementType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

    @Query("SELECT sm FROM StockMovement sm WHERE " +
           "(:productId IS NULL OR sm.product.id = :productId) " +
           "AND (:warehouseId IS NULL OR sm.warehouse.id = :warehouseId) " +
           "AND (:type IS NULL OR sm.movementType = :type) " +
           "AND (:fromDate IS NULL OR sm.createdAt >= :fromDate) " +
           "AND (:toDate IS NULL OR sm.createdAt <= :toDate) " +
           "ORDER BY sm.createdAt DESC")
    Page<StockMovement> findWithFilters(@Param("productId") UUID productId,
                                        @Param("warehouseId") UUID warehouseId,
                                        @Param("type") MovementType type,
                                        @Param("fromDate") LocalDateTime fromDate,
                                        @Param("toDate") LocalDateTime toDate,
                                        Pageable pageable);

    @Query("SELECT COALESCE(SUM(sm.quantity), 0) FROM StockMovement sm " +
           "WHERE sm.movementType = :type AND sm.createdAt BETWEEN :from AND :to")
    Long sumByTypeAndDateRange(@Param("type") MovementType type,
                                @Param("from") LocalDateTime from,
                                @Param("to") LocalDateTime to);

    List<StockMovement> findTop10ByProductIdOrderByCreatedAtDesc(UUID productId);
}
