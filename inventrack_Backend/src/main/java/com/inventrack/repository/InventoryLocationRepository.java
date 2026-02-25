package com.inventrack.repository;

import com.inventrack.entity.InventoryLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InventoryLocationRepository extends JpaRepository<InventoryLocation, UUID> {
    Optional<InventoryLocation> findByProductIdAndWarehouseId(UUID productId, UUID warehouseId);
    List<InventoryLocation> findByProductId(UUID productId);
    List<InventoryLocation> findByWarehouseId(UUID warehouseId);

    @Query("SELECT COALESCE(SUM(il.quantity), 0) FROM InventoryLocation il WHERE il.product.id = :productId")
    Integer getTotalQuantityByProduct(UUID productId);
    
    @Query("""
    	    SELECT il.product.id, SUM(il.quantity)
    	    FROM InventoryLocation il
    	    GROUP BY il.product.id
    	""")
    	List<Object[]> getTotalQuantities();
}

