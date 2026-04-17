package lk.medilink.doctor.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpsertDoctorProfileRequest(
		@NotBlank String fullName,
		String phone,
		@NotBlank String registrationNo,
		@NotBlank String specialization,
		String documentsUrl,
		@Size(max = 1000) String bio,
		@Min(0) @Max(80) Integer yearsOfExperience,
		@Min(0) @Max(500000) Integer consultationFeeLkr,
		@Size(max = 500) String clinicAddress
) {
}
