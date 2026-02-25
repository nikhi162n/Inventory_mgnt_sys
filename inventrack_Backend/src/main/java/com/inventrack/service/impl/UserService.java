package com.inventrack.service.impl;

import com.inventrack.dto.request.UserRequest;
import com.inventrack.dto.response.PagedResponse;
import com.inventrack.entity.User;
import com.inventrack.enums.UserRole;
import com.inventrack.enums.UserStatus;
import com.inventrack.exception.ApiException;
import com.inventrack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public PagedResponse<Map<String, Object>> getAll(String search, String role, String status, int page, int limit) {
        UserRole roleEnum = role != null ? UserRole.valueOf(role.toUpperCase()) : null;
        UserStatus statusEnum = status != null ? UserStatus.valueOf(status.toUpperCase()) : null;
        var pageable = PageRequest.of(page - 1, limit, Sort.by("createdAt").descending());
        var users = userRepository.findWithFilters(search, roleEnum, statusEnum, pageable);
        return PagedResponse.from(users.map(this::toMap));
    }

    public Map<String, Object> getById(UUID id) {
        return toMap(findOrThrow(id));
    }

    @Transactional
    public Map<String, Object> create(UserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw ApiException.conflict("Email already in use: " + request.getEmail());
        }
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .status(request.getStatus())
                .build();
        return toMap(userRepository.save(user));
    }

    @Transactional
    public Map<String, Object> update(UUID id, Map<String, Object> updates) {
        User user = findOrThrow(id);
        if (updates.containsKey("name")) user.setName((String) updates.get("name"));
        if (updates.containsKey("role")) user.setRole(UserRole.valueOf((String) updates.get("role")));
        if (updates.containsKey("status")) user.setStatus(UserStatus.valueOf((String) updates.get("status")));
        return toMap(userRepository.save(user));
    }

    @Transactional
    public void delete(UUID id) {
        User user = findOrThrow(id);
        user.setStatus(UserStatus.INACTIVE);
        userRepository.save(user);
    }

    private User findOrThrow(UUID id) {
        return userRepository.findById(id).orElseThrow(() -> ApiException.notFound("User not found: " + id));
    }

    private Map<String, Object> toMap(User u) {
        return Map.of(
                "id", u.getId(),
                "name", u.getName(),
                "email", u.getEmail(),
                "role", u.getRole(),
                "status", u.getStatus(),
                "lastLoginAt", u.getLastLoginAt() != null ? u.getLastLoginAt().toString() : "",
                "createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : ""
        );
    }
}
