package lk.medilink.doctor.web.dto;

import jakarta.validation.constraints.NotBlank;

public record UpsertDoctorProfileRequest(
		@NotBlank String fullName,
		String phone,
		@NotBlank String registrationNo,
		@NotBlank String specialization,
		String documentsUrl
) {
}
