package lk.medilink.appointment.web.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record CreateAppointmentRequest(
		@NotNull Long doctorId,
		@NotNull @Future Instant slotTime
) {
}

