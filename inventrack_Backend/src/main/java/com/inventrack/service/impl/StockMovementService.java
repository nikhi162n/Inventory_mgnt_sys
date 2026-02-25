package com.inventrack.service.impl;

import com.inventrack.dto.request.StockMovementRequest;
import com.inventrack.dto.response.PagedResponse;
import com.inventrack.entity.*;
import com.inventrack.enums.MovementType;
import com.inventrack.exception.ApiException;
import com.inventrack.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockMovementService {

    private final StockMovementRepository movementRepository;
    private final InventoryLocationRepository inventoryLocationRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    public PagedResponse<Map<String, Object>> getAll(UUID productId, UUID warehouseId, String type,
                                                      LocalDateTime fromDate, LocalDateTime toDate,
                                                      int page, int limit) {
        MovementType movementType = type != null ? MovementType.valueOf(type.toUpperCase()) : null;
        var pageable = PageRequest.of(page - 1, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        var movements = movementRepository.findWithFilters(productId, warehouseId, movementType, fromDate, toDate, pageable);
        return PagedResponse.from(movements.map(this::toMap));
    }

    @Transactional
    public Map<String, Object> recordMovement(StockMovementRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> ApiException.notFound("Product not found"));
        Warehouse warehouse = warehouseRepository.findById(request.getWarehouseId())
                .orElseThrow(() -> ApiException.notFound("Warehouse not found"));

        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User performer = userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        InventoryLocation location = inventoryLocationRepository
                .findByProductIdAndWarehouseId(product.getId(), warehouse.getId())
                .orElseGet(() -> InventoryLocation.builder().product(product).warehouse(warehouse).quantity(0).build());

        int before = location.getQuantity();
        int after;

        switch (request.getMovementType()) {
            case IN -> after = before + request.getQuantity();
            case OUT -> {
                if (before < request.getQuantity()) {
                    throw ApiException.badRequest("Insufficient stock. Available: " + before);
                }
                after = before - request.getQuantity();
            }
            case ADJUSTMENT -> after = request.getQuantity();
            case TRANSFER -> {
                if (before < request.getQuantity()) {
                    throw ApiException.badRequest("Insufficient stock for transfer. Available: " + before);
                }
                after = before - request.getQuantity();
                handleTransfer(product, request, performer, before);
            }
            default -> throw ApiException.badRequest("Unknown movement type");
        }

        location.setQuantity(after);
        inventoryLocationRepository.save(location);

        StockMovement movement = StockMovement.builder()
                .product(product).warehouse(warehouse)
                .movementType(request.getMovementType())
                .quantity(request.getQuantity())
                .quantityBefore(before).quantityAfter(after)
                .referenceNo(request.getReferenceNo())
                .notes(request.getNotes())
                .unitCost(request.getUnitCost())
                .performedBy(performer)
                .build();

        movement = movementRepository.save(movement);
        productService.updateProductStatus(product);

        log.info("Stock movement recorded: {} {} units of {}", request.getMovementType(), request.getQuantity(), product.getSku());
        return toMap(movement);
    }

    private void handleTransfer(Product product, StockMovementRequest request, User performer, int sourceBefore) {
        if (request.getToWarehouseId() == null) {
            throw ApiException.badRequest("Destination warehouse required for transfer");
        }
        Warehouse toWarehouse = warehouseRepository.findById(request.getToWarehouseId())
                .orElseThrow(() -> ApiException.notFound("Destination warehouse not found"));

        InventoryLocation dest = inventoryLocationRepository
                .findByProductIdAndWarehouseId(product.getId(), toWarehouse.getId())
                .orElseGet(() -> InventoryLocation.builder().product(product).warehouse(toWarehouse).quantity(0).build());

        int destBefore = dest.getQuantity();
        dest.setQuantity(destBefore + request.getQuantity());
        inventoryLocationRepository.save(dest);
    }

    private Map<String, Object> toMap(StockMovement sm) {

        Map<String, Object> map = new LinkedHashMap<>();

        map.put("id", sm.getId());

        map.put("product", Map.of(
                "id", sm.getProduct().getId(),
                "name", sm.getProduct().getName(),
                "sku", sm.getProduct().getSku()
        ));

        map.put("warehouse", Map.of(
                "id", sm.getWarehouse().getId(),
                "name", sm.getWarehouse().getName()
        ));

        map.put("movementType", sm.getMovementType());
        map.put("quantity", sm.getQuantity());
        map.put("quantityBefore", sm.getQuantityBefore());
        map.put("quantityAfter", sm.getQuantityAfter());
        map.put("referenceNo", sm.getReferenceNo() != null ? sm.getReferenceNo() : "");
        map.put("notes", sm.getNotes() != null ? sm.getNotes() : "");

        map.put("performedBy", Map.of(
                "id", sm.getPerformedBy().getId(),
                "name", sm.getPerformedBy().getName()
        ));

        map.put("createdAt", sm.getCreatedAt());

        return map;
    }
}
