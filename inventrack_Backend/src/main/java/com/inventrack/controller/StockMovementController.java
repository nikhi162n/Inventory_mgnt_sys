package com.inventrack.controller;

import com.inventrack.dto.request.StockMovementRequest;
import com.inventrack.dto.response.PagedResponse;
import com.inventrack.service.impl.StockMovementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/movements")
@RequiredArgsConstructor
@Tag(name = "Stock Movements", description = "Manage stock IN/OUT/transfer movements")
public class StockMovementController {

    private final StockMovementService stockMovementService;

    @GetMapping
    @Operation(summary = "List stock movement history")
    public ResponseEntity<PagedResponse<Map<String, Object>>> getAll(
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(stockMovementService.getAll(productId, warehouseId, type, fromDate, toDate, page, limit));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @Operation(summary = "Record a stock movement")
    public ResponseEntity<Map<String, Object>> record(@Valid @RequestBody StockMovementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(stockMovementService.recordMovement(request));
    }
}
