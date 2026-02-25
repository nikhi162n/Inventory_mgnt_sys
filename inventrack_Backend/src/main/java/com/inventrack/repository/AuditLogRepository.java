package com.inventrack.repository;

import com.inventrack.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("SELECT a FROM AuditLog a WHERE " +
           "(:userId IS NULL OR a.user.id = :userId) " +
           "AND (:entityType IS NULL OR a.entityType = :entityType) " +
           "AND (:action IS NULL OR a.action LIKE CONCAT('%',:action,'%')) " +
           "AND (:fromDate IS NULL OR a.createdAt >= :fromDate) " +
           "AND (:toDate IS NULL OR a.createdAt <= :toDate) " +
           "ORDER BY a.createdAt DESC")
    Page<AuditLog> findWithFilters(@Param("userId") UUID userId,
                                    @Param("entityType") String entityType,
                                    @Param("action") String action,
                                    @Param("fromDate") LocalDateTime fromDate,
                                    @Param("toDate") LocalDateTime toDate,
                                    Pageable pageable);
}
