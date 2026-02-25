package com.inventrack.service.impl;

import com.inventrack.dto.request.AuthRequest;
import com.inventrack.dto.response.AuthResponse;
import com.inventrack.entity.User;
import com.inventrack.exception.ApiException;
import com.inventrack.repository.UserRepository;
import com.inventrack.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse login(AuthRequest.Login request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> ApiException.unauthorized("User not found"));

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        log.info("User logged in: {}", user.getEmail());
        return buildAuthResponse(user);
    }

    public AuthResponse refresh(AuthRequest.RefreshToken request) {
        try {
            String email = jwtUtil.extractUsername(request.getRefreshToken());
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> ApiException.unauthorized("User not found"));
            if (!jwtUtil.isTokenValid(request.getRefreshToken(), user)) {
                throw ApiException.unauthorized("Invalid refresh token");
            }
            return buildAuthResponse(user);
        } catch (Exception e) {
            throw ApiException.unauthorized("Invalid or expired refresh token");
        }
    }

    private AuthResponse buildAuthResponse(User user) {
        return AuthResponse.builder()
                .token(jwtUtil.generateToken(user))
                .refreshToken(jwtUtil.generateRefreshToken(user))
                .expiresIn(86400)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .avatarUrl(user.getAvatarUrl())
                        .build())
                .build();
    }
}
