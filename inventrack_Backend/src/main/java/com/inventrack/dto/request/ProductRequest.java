package com.inventrack.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 255)
    private String name;

    @NotBlank(message = "SKU is required")
    @Size(max = 100)
    private String sku;

    private String barcode;
    private String description;
    private UUID categoryId;
    private UUID supplierId;

    @NotNull @DecimalMin("0.00")
    private BigDecimal costPrice;

    @NotNull @DecimalMin("0.00")
    private BigDecimal sellingPrice;

    @Min(0)
    private Integer reorderPoint = 10;

    @Min(0)
    private Integer reorderQty = 50;

    @Size(max = 30)
    private String unit = "piece";

    private BigDecimal weightKg;
    private String imageUrl;
    private String[] tags;

    // Initial stock when creating
    private InitialStock initialStock;

    @Data
    public static class InitialStock {
        private UUID warehouseId;
        @Min(0)
        private Integer quantity;
    }
}
