package com.inventrack.dto.request;

import com.inventrack.enums.MovementType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class StockMovementRequest {

    @NotNull(message = "Product ID is required")
    private UUID productId;

    @NotNull(message = "Warehouse ID is required")
    private UUID warehouseId;

    @NotNull(message = "Movement type is required")
    private MovementType movementType;

    @NotNull @Min(1)
    private Integer quantity;

    private String referenceNo;
    private String notes;
    private BigDecimal unitCost;

    // For transfers
    private UUID toWarehouseId;
}
