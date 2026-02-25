package com.inventrack.dto.response;

import com.inventrack.enums.UserRole;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String refreshToken;
    private long expiresIn;
    private UserInfo user;

    @Data
    @Builder
    public static class UserInfo {
        private UUID id;
        private String name;
        private String email;
        private UserRole role;
        private String avatarUrl;
    }
}
