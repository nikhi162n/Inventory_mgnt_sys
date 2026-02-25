package com.inventrack.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class PurchaseOrderRequest {

    @NotNull(message = "Supplier is required")
    private UUID supplierId;

    @NotNull(message = "Warehouse is required")
    private UUID warehouseId;

    private LocalDate expectedDate;
    private String notes;

    @NotEmpty(message = "At least one item is required")
    private List<POItem> items;

    @Data
    public static class POItem {
        @NotNull private UUID productId;
        @NotNull @Min(1) private Integer quantityOrdered;
        @NotNull private BigDecimal unitCost;
    }
}
