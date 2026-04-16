package lk.medilink.symptomchecker.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SymptomCheckRequest(
		@NotBlank @Size(max = 2000) String symptoms,
		@Min(0) @Max(120) Integer age,
		@Min(0) @Max(365) Integer durationDays
) {
}
