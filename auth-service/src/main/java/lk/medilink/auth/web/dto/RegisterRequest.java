package lk.medilink.auth.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lk.medilink.auth.domain.UserRole;

public record RegisterRequest(
		@Email @NotBlank String email,
		@NotBlank String password,
		@NotNull UserRole role
) {
}

