package com.inventrack.service.impl;

import com.inventrack.entity.Product;
import com.inventrack.enums.MovementType;
import com.inventrack.enums.ProductStatus;
import com.inventrack.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

	private final ProductRepository productRepository;
	private final InventoryLocationRepository inventoryLocationRepository;
	private final StockMovementRepository movementRepository;
	private final CategoryRepository categoryRepository;
	private final WarehouseRepository warehouseRepository;

//    public Map<String, Object> getInventoryValuation(UUID warehouseId, UUID categoryId, LocalDateTime asOf) {
//        List<Product> products = productRepository.findAll().stream()
//                .filter(p -> p.getIsActive())
//                .filter(p -> categoryId == null || (p.getCategory() != null && p.getCategory().getId().equals(categoryId)))
//                .toList();
//
//        BigDecimal totalValue = BigDecimal.ZERO;
//        int totalUnits = 0;
//        Map<String, BigDecimal> byCategory = new LinkedHashMap<>();
//        Map<String, BigDecimal> byWarehouse = new LinkedHashMap<>();
//
//        for (Product p : products) {
//            Integer qty = inventoryLocationRepository.getTotalQuantityByProduct(p.getId());
//            if (qty == null) qty = 0;
//            BigDecimal value = p.getCostPrice().multiply(BigDecimal.valueOf(qty));
//            totalValue = totalValue.add(value);
//            totalUnits += qty;
//
//            String catName = p.getCategory() != null ? p.getCategory().getName() : "Uncategorized";
//            byCategory.merge(catName, value, BigDecimal::add);
//        }
//
//        List<Map<String, Object>> byCategoryList = byCategory.entrySet().stream()
//                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
//                .map(e -> {
//                    double pct = totalValue.compareTo(BigDecimal.ZERO) > 0
//                            ? e.getValue()
//                               .divide(totalValue, 4, java.math.RoundingMode.HALF_UP)
//                               .doubleValue() * 100
//                            : 0;
//
//                    Map<String, Object> map = new LinkedHashMap<>();
//                    map.put("category", e.getKey());
//                    map.put("value", e.getValue());
//                    map.put("percentage", Math.round(pct * 10.0) / 10.0);
//
//                    return map;
//                })
//                .toList();
//
//        return Map.of(
//                "asOf", asOf != null ? asOf.toString() : LocalDateTime.now().toString(),
//                "totalValue", totalValue,
//                "totalUnits", totalUnits,
//                "byCategory", byCategoryList
//        );
//    }
	public Map<String, Object> getInventoryValuation(UUID warehouseId, UUID categoryId, LocalDateTime asOf) {

		List<Product> products = productRepository.findActiveProducts(categoryId);

		Map<UUID, Integer> qtyMap = inventoryLocationRepository.getTotalQuantities().stream()
				.collect(Collectors.toMap(r -> (UUID) r[0], r -> ((Long) r[1]).intValue()));

		BigDecimal totalValue = BigDecimal.ZERO;
		int totalUnits = 0;
		Map<String, BigDecimal> byCategory = new LinkedHashMap<>();

		for (Product p : products) {

			int qty = qtyMap.getOrDefault(p.getId(), 0);
			BigDecimal value = p.getCostPrice().multiply(BigDecimal.valueOf(qty));

			totalValue = totalValue.add(value);
			totalUnits += qty;

			String catName = p.getCategory() != null ? p.getCategory().getName() : "Uncategorized";

			byCategory.merge(catName, value, BigDecimal::add);
		}
		final BigDecimal finalTotalValue = totalValue;
		List<Map<String, Object>> byCategoryList = byCategory.entrySet().stream()
		        .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
		        .map(e -> {

		            BigDecimal pct = BigDecimal.ZERO;

		            if (finalTotalValue.compareTo(BigDecimal.ZERO) > 0) {
		                pct = e.getValue()
		                        .divide(finalTotalValue, 4, RoundingMode.HALF_UP)
		                        .multiply(BigDecimal.valueOf(100))
		                        .setScale(1, RoundingMode.HALF_UP);
		            }

		            Map<String, Object> map = new LinkedHashMap<>();
		            map.put("category", e.getKey());
		            map.put("value", e.getValue());
		            map.put("percentage", pct);

		            return map;
		        })
		        .toList();

		return Map.of("asOf", asOf != null ? asOf : LocalDateTime.now(), "totalValue", totalValue, "totalUnits",
				totalUnits, "byCategory", byCategoryList);
	}

	public Map<String, Object> getStockMovementReport(LocalDateTime fromDate, LocalDateTime toDate, UUID productId,
			UUID warehouseId) {
		if (fromDate == null)
			fromDate = LocalDateTime.now().minusDays(30);
		if (toDate == null)
			toDate = LocalDateTime.now();

		long totalIn = Optional.ofNullable(movementRepository.sumByTypeAndDateRange(MovementType.IN, fromDate, toDate))
				.orElse(0L);
		long totalOut = Optional
				.ofNullable(movementRepository.sumByTypeAndDateRange(MovementType.OUT, fromDate, toDate)).orElse(0L);
		long adjustments = Optional
				.ofNullable(movementRepository.sumByTypeAndDateRange(MovementType.ADJUSTMENT, fromDate, toDate))
				.orElse(0L);

		return Map.of("fromDate", fromDate.toString(), "toDate", toDate.toString(), "summary", Map.of("totalIn",
				totalIn, "totalOut", totalOut, "netChange", totalIn - totalOut, "adjustments", adjustments));
	}

	public Map<String, Object> getReorderReport() {
		List<Product> alertProducts = productRepository.findLowStockProducts();
		List<Map<String, Object>> items = alertProducts.stream().map(p -> {
			Integer currentQty = inventoryLocationRepository.getTotalQuantityByProduct(p.getId());
			if (currentQty == null)
				currentQty = 0;
			int shortage = Math.max(0, p.getReorderPoint() - currentQty);
			BigDecimal estimatedCost = p.getCostPrice().multiply(BigDecimal.valueOf(p.getReorderQty()));

			Map<String, Object> item = new LinkedHashMap<>();
			item.put("productId", p.getId());
			item.put("sku", p.getSku());
			item.put("name", p.getName());
			item.put("currentQty", currentQty);
			item.put("reorderPoint", p.getReorderPoint());
			item.put("reorderQty", p.getReorderQty());
			item.put("suggestedOrderQty", p.getReorderQty());
			item.put("shortage", shortage);
			item.put("estimatedCost", estimatedCost);
			if (p.getSupplier() != null) {
				item.put("supplier", Map.of("name", p.getSupplier().getName(), "leadTimeDays",
						p.getSupplier().getLeadTimeDays() != null ? p.getSupplier().getLeadTimeDays() : 0));
			}
			return item;
		}).toList();

		return Map.of("data", items, "total", items.size());
	}

	public Map<String, Object> getTopProducts(int limit, String metric) {
		List<Product> allProducts = productRepository.findAll().stream().filter(p -> p.getIsActive()).toList();

		BigDecimal grandTotal = BigDecimal.ZERO;
		List<Map<String, Object>> ranked = new ArrayList<>();

		for (Product p : allProducts) {
			Integer qty = inventoryLocationRepository.getTotalQuantityByProduct(p.getId());
			if (qty == null)
				qty = 0;
			BigDecimal val = p.getCostPrice().multiply(BigDecimal.valueOf(qty));
			grandTotal = grandTotal.add(val);
			Map<String, Object> item = new LinkedHashMap<>();
			item.put("productId", p.getId());
			item.put("name", p.getName());
			item.put("sku", p.getSku());
			item.put("totalQty", qty);
			item.put("totalValue", val);
			item.put("_sortVal", "quantity".equals(metric) ? qty : val.longValue());
			ranked.add(item);
		}

		final BigDecimal gt = grandTotal;
		ranked.sort((a, b) -> Long.compare((Long) b.get("_sortVal"), (Long) a.get("_sortVal")));
		List<Map<String, Object>> top = ranked.stream().limit(limit).collect(Collectors.toList());

		for (int i = 0; i < top.size(); i++) {
			top.get(i).put("rank", i + 1);
			BigDecimal val = (BigDecimal) top.get(i).get("totalValue");
			double pct = gt.compareTo(BigDecimal.ZERO) > 0
					? val.divide(gt, 4, java.math.RoundingMode.HALF_UP).doubleValue() * 100
					: 0;
			top.get(i).put("percentageOfTotal", Math.round(pct * 10.0) / 10.0);
			top.get(i).remove("_sortVal");
		}

		return Map.of("data", top);
	}
}
