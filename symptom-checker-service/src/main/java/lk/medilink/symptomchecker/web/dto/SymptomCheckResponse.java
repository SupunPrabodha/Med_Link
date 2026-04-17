package lk.medilink.symptomchecker.web.dto;

import java.time.Instant;
import java.util.List;

public record SymptomCheckResponse(
		Long id,
		Instant createdAt,
		String riskLevel,
		String summary,
		String advice,
		List<String> recommendedSpecialties
) {
}
