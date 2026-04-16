package lk.medilink.symptomchecker.web.dto;

import java.time.Instant;

public record SymptomCheckResponse(
		Long id,
		Instant createdAt,
		String riskLevel,
		String summary,
		String advice
) {
}
