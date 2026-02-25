package com.inventrack.dto.request;

import com.inventrack.enums.UserRole;
import com.inventrack.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserRequest {
    @NotBlank @Size(max = 120)
    private String name;

    @NotBlank @Email @Size(max = 255)
    private String email;

    @NotBlank @Size(min = 6)
    private String password;

    @NotNull
    private UserRole role;

    private UserStatus status = UserStatus.ACTIVE;
}
