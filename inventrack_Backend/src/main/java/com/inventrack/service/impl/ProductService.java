package com.inventrack.service.impl;

import com.inventrack.dto.request.ProductRequest;
import com.inventrack.dto.response.PagedResponse;
import com.inventrack.dto.response.ProductResponse;
import com.inventrack.entity.*;
import com.inventrack.enums.ProductStatus;
import com.inventrack.exception.ApiException;
import com.inventrack.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryLocationRepository inventoryLocationRepository;

    public PagedResponse<ProductResponse> getAll(String search, UUID categoryId, UUID supplierId,
                                                  String status, int page, int limit, String sort, String order) {
        ProductStatus statusEnum = status != null ? ProductStatus.valueOf(status.toUpperCase()) : null;
        Sort.Direction direction = "desc".equalsIgnoreCase(order) ? Sort.Direction.DESC : Sort.Direction.ASC;
        var pageable = PageRequest.of(page - 1, limit, Sort.by(direction, mapSortField(sort)));

        Page<Product> products = productRepository.findWithFilters(search, categoryId, supplierId, statusEnum, pageable);
        return PagedResponse.from(products.map(this::toResponse));
    }

    public ProductResponse getById(UUID id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        if (productRepository.existsBySku(request.getSku())) {
            throw ApiException.conflict("SKU already exists: " + request.getSku());
        }

        Product product = Product.builder()
                .name(request.getName())
                .sku(request.getSku())
                .barcode(request.getBarcode())
                .description(request.getDescription())
                .costPrice(request.getCostPrice())
                .sellingPrice(request.getSellingPrice())
                .reorderPoint(request.getReorderPoint())
                .reorderQty(request.getReorderQty())
                .unit(request.getUnit())
                .weightKg(request.getWeightKg())
                .imageUrl(request.getImageUrl())
                .tags(request.getTags())
                .build();

        if (request.getCategoryId() != null) {
            product.setCategory(categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> ApiException.notFound("Category not found")));
        }
        if (request.getSupplierId() != null) {
            product.setSupplier(supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> ApiException.notFound("Supplier not found")));
        }

        product = productRepository.save(product);

        // Set initial stock
        if (request.getInitialStock() != null && request.getInitialStock().getWarehouseId() != null) {
            Warehouse warehouse = warehouseRepository.findById(request.getInitialStock().getWarehouseId())
                    .orElseThrow(() -> ApiException.notFound("Warehouse not found"));
            InventoryLocation loc = InventoryLocation.builder()
                    .product(product).warehouse(warehouse)
                    .quantity(request.getInitialStock().getQuantity()).build();
            inventoryLocationRepository.save(loc);
            updateProductStatus(product);
        }

        log.info("Product created: {} ({})", product.getName(), product.getSku());
        return toResponse(product);
    }

    @Transactional
    public ProductResponse update(UUID id, ProductRequest request) {
        Product product = findOrThrow(id);

        if (!product.getSku().equals(request.getSku()) && productRepository.existsBySku(request.getSku())) {
            throw ApiException.conflict("SKU already exists: " + request.getSku());
        }

        product.setName(request.getName());
        product.setSku(request.getSku());
        product.setBarcode(request.getBarcode());
        product.setDescription(request.getDescription());
        product.setCostPrice(request.getCostPrice());
        product.setSellingPrice(request.getSellingPrice());
        product.setReorderPoint(request.getReorderPoint());
        product.setReorderQty(request.getReorderQty());
        product.setUnit(request.getUnit());
        product.setWeightKg(request.getWeightKg());
        product.setImageUrl(request.getImageUrl());
        product.setTags(request.getTags());

        if (request.getCategoryId() != null) {
            product.setCategory(categoryRepository.findById(request.getCategoryId()).orElse(null));
        }
        if (request.getSupplierId() != null) {
            product.setSupplier(supplierRepository.findById(request.getSupplierId()).orElse(null));
        }

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public void delete(UUID id) {
        Product product = findOrThrow(id);
        product.setIsActive(false);
        product.setStatus(ProductStatus.DISCONTINUED);
        productRepository.save(product);
        log.info("Product discontinued: {}", id);
    }

    public List<ProductResponse> getLowStockAlerts() {
        return productRepository.findLowStockProducts().stream().map(this::toResponse).toList();
    }

    public void updateProductStatus(Product product) {
        Integer totalQty = inventoryLocationRepository.getTotalQuantityByProduct(product.getId());
        if (totalQty == null) totalQty = 0;
        if (totalQty == 0) product.setStatus(ProductStatus.CRITICAL);
        else if (totalQty <= product.getReorderPoint()) product.setStatus(ProductStatus.LOW_STOCK);
        else product.setStatus(ProductStatus.IN_STOCK);
        productRepository.save(product);
    }

    private Product findOrThrow(UUID id) {
        return productRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Product not found: " + id));
    }

    private String mapSortField(String sort) {
        return switch (sort != null ? sort : "createdAt") {
            case "name" -> "name";
            case "price" -> "sellingPrice";
            case "qty" -> "createdAt";
            default -> "createdAt";
        };
    }

    public ProductResponse toResponse(Product p) {
        Integer totalQty = inventoryLocationRepository.getTotalQuantityByProduct(p.getId());
        if (totalQty == null) totalQty = 0;

        List<ProductResponse.WarehouseStock> stockByWarehouse = inventoryLocationRepository
                .findByProductId(p.getId()).stream()
                .map(il -> ProductResponse.WarehouseStock.builder()
                        .warehouseId(il.getWarehouse().getId())
                        .warehouseName(il.getWarehouse().getName())
                        .quantity(il.getQuantity())
                        .build())
                .toList();

        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .sku(p.getSku())
                .barcode(p.getBarcode())
                .description(p.getDescription())
                .category(p.getCategory() != null ?
                        ProductResponse.CategoryInfo.builder().id(p.getCategory().getId()).name(p.getCategory().getName()).build() : null)
                .supplier(p.getSupplier() != null ?
                        ProductResponse.SupplierInfo.builder().id(p.getSupplier().getId()).name(p.getSupplier().getName()).build() : null)
                .costPrice(p.getCostPrice())
                .sellingPrice(p.getSellingPrice())
                .totalQty(totalQty)
                .totalValue(p.getCostPrice().multiply(BigDecimal.valueOf(totalQty)))
                .reorderPoint(p.getReorderPoint())
                .reorderQty(p.getReorderQty())
                .status(p.getStatus())
                .unit(p.getUnit())
                .weightKg(p.getWeightKg())
                .imageUrl(p.getImageUrl())
                .tags(p.getTags())
                .stockByWarehouse(stockByWarehouse)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
