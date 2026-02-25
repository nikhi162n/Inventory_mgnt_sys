package com.inventrack.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedResponse<T> {
    private List<T> data;
    private Meta meta;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Meta {
        private long total;
        private int page;
        private int limit;
        private int pages;
        private boolean hasNext;
        private boolean hasPrev;
    }

    public static <T> PagedResponse<T> from(Page<T> page) {
        return PagedResponse.<T>builder()
                .data(page.getContent())
                .meta(Meta.builder()
                        .total(page.getTotalElements())
                        .page(page.getNumber() + 1)
                        .limit(page.getSize())
                        .pages(page.getTotalPages())
                        .hasNext(page.hasNext())
                        .hasPrev(page.hasPrevious())
                        .build())
                .build();
    }
}
