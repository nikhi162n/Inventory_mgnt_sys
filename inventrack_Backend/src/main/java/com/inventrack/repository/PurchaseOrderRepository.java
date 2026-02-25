package com.inventrack.repository;

import com.inventrack.entity.PurchaseOrder;
import com.inventrack.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, UUID> {
    Optional<PurchaseOrder> findByPoNumber(String poNumber);

    @Query("SELECT po FROM PurchaseOrder po WHERE " +
           "(:status IS NULL OR po.status = :status) " +
           "AND (:supplierId IS NULL OR po.supplier.id = :supplierId) " +
           "AND (:fromDate IS NULL OR po.createdAt >= :fromDate) " +
           "AND (:toDate IS NULL OR po.createdAt <= :toDate) " +
           "ORDER BY po.createdAt DESC")
    Page<PurchaseOrder> findWithFilters(@Param("status") OrderStatus status,
                                        @Param("supplierId") UUID supplierId,
                                        @Param("fromDate") LocalDateTime fromDate,
                                        @Param("toDate") LocalDateTime toDate,
                                        Pageable pageable);

    @Query("SELECT COUNT(po) FROM PurchaseOrder po WHERE po.poNumber LIKE :prefix%")
    long countByPoNumberStartingWith(@Param("prefix") String prefix);
}
