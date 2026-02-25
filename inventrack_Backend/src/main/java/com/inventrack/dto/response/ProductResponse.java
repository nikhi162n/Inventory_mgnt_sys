package com.inventrack.dto.response;

import com.inventrack.enums.ProductStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ProductResponse {
    private UUID id;
    private String name;
    private String sku;
    private String barcode;
    private String description;
    private CategoryInfo category;
    private SupplierInfo supplier;
    private BigDecimal costPrice;
    private BigDecimal sellingPrice;
    private Integer totalQty;
    private BigDecimal totalValue;
    private Integer reorderPoint;
    private Integer reorderQty;
    private ProductStatus status;
    private String unit;
    private BigDecimal weightKg;
    private String imageUrl;
    private String[] tags;
    private List<WarehouseStock> stockByWarehouse;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data @Builder
    public static class CategoryInfo { private UUID id; private String name; }

    @Data @Builder
    public static class SupplierInfo { private UUID id; private String name; }

    @Data @Builder
    public static class WarehouseStock {
        private UUID warehouseId;
        private String warehouseName;
        private Integer quantity;
    }
}
