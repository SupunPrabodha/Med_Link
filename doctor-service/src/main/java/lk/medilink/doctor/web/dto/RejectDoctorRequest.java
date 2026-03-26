package lk.medilink.doctor.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectDoctorRequest(
		@NotBlank String reason
) {
}
