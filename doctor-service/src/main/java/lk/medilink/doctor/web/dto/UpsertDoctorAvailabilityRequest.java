package lk.medilink.doctor.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

public record UpsertDoctorAvailabilityRequest(
		@NotNull @Size(max = 50) List<@Valid AvailabilityBlock> blocks
) {
	public record AvailabilityBlock(
			@NotNull DayOfWeek dayOfWeek,
			@NotNull LocalTime startTime,
			@NotNull LocalTime endTime
	) {
	}
}
