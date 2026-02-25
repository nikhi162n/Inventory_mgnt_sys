package com.inventrack.controller;

import com.inventrack.dto.response.ProductResponse;
import com.inventrack.service.impl.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Inventory stock level queries")
public class InventoryController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Current stock levels")
    public ResponseEntity<Map<String, Object>> getCurrentStock(
            @RequestParam(required = false) String warehouseId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "false") boolean lowStockOnly) {
        List<ProductResponse> products = lowStockOnly
                ? productService.getLowStockAlerts()
                : productService.getAll(null, null, null, status, 1, 100, "name", "asc").getData();
        return ResponseEntity.ok(Map.of("data", products, "count", products.size()));
    }

    @GetMapping("/alerts")
    @Operation(summary = "Products at or below reorder point")
    public ResponseEntity<Map<String, Object>> getAlerts() {
        List<ProductResponse> alerts = productService.getLowStockAlerts();
        return ResponseEntity.ok(Map.of(
                "data", alerts,
                "totalAlerts", alerts.size()
        ));
    }
}
