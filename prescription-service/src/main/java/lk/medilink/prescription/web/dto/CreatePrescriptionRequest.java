package lk.medilink.prescription.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreatePrescriptionRequest(
		@NotNull(message = "patientUserId is required")
		@Positive(message = "patientUserId must be positive")
		Long patientUserId,

		@Positive(message = "appointmentId must be positive")
		Long appointmentId,

		@Size(max = 2000, message = "Diagnosis is too long")
		String diagnosis,

		@NotBlank(message = "Medications is required")
		@Size(max = 10000, message = "Medications is too long")
		String medications,

		@Size(max = 10000, message = "Notes is too long")
		String notes
) {
}
