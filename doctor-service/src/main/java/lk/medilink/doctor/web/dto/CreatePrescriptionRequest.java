package lk.medilink.doctor.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreatePrescriptionRequest(
        @NotNull Long appointmentId,
        @NotNull Long patientId,
        @NotBlank String diagnosis,
        @NotBlank String medicines,
        String notes
) {
}
