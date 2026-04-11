package lk.medilink.patient.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpsertPatientProfileRequest(
		@NotBlank(message = "Full name is required")
		@Size(max = 200, message = "Full name is too long")
		String fullName,

		@NotBlank(message = "Phone is required")
		@Size(max = 50, message = "Phone is too long")
		String phone,

		@Past(message = "Date of birth must be in the past")
		LocalDate dateOfBirth,

		@Size(max = 500, message = "Address is too long")
		String address
) {
}
