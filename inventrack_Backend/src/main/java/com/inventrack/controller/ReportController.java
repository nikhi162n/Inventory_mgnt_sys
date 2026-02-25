package com.inventrack.controller;

import com.inventrack.service.impl.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Tag(name = "Reports", description = "Analytics and reporting endpoints")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/inventory-valuation")
    @Operation(summary = "Inventory valuation by category/warehouse")
    public ResponseEntity<Map<String, Object>> inventoryValuation(
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime asOfDate) {
        return ResponseEntity.ok(reportService.getInventoryValuation(warehouseId, categoryId, asOfDate));
    }

    @GetMapping("/stock-movement")
    @Operation(summary = "Stock movement summary for a date range")
    public ResponseEntity<Map<String, Object>> stockMovement(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) UUID warehouseId) {
        return ResponseEntity.ok(reportService.getStockMovementReport(fromDate, toDate, productId, warehouseId));
    }

    @GetMapping("/reorder")
    @Operation(summary = "Products requiring reorder")
    public ResponseEntity<Map<String, Object>> reorderReport() {
        return ResponseEntity.ok(reportService.getReorderReport());
    }

    @GetMapping("/top-products")
    @Operation(summary = "Top products by value or quantity")
    public ResponseEntity<Map<String, Object>> topProducts(
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(defaultValue = "value") String metric) {
        return ResponseEntity.ok(reportService.getTopProducts(limit, metric));
    }
}
