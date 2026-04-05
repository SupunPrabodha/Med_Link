package lk.medilink.doctor.web.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;

public record UpdateAvailabilityRequest(
        @NotNull LocalTime startTime,
        @NotNull LocalTime endTime,
        @NotNull Boolean active
) {
}
