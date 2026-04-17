package lk.medilink.symptomchecker.service;

import lk.medilink.symptomchecker.domain.SymptomAssessment;
import lk.medilink.symptomchecker.repo.SymptomAssessmentRepository;
import lk.medilink.symptomchecker.web.dto.SymptomCheckRequest;
import org.junit.jupiter.api.Test;
import org.springframework.boot.web.client.RestTemplateBuilder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class SymptomCheckerAppServiceTest {
	@Test
	void check_setsRecommendedSpecialties_fromHeuristic_whenAiDisabled() {
		SymptomAssessmentRepository repo = mock(SymptomAssessmentRepository.class);
		when(repo.save(any(SymptomAssessment.class))).thenAnswer(inv -> inv.getArgument(0));

		SymptomCheckerAppService svc = new SymptomCheckerAppService(
				repo,
				new RestTemplateBuilder(),
				false,
				"",
				"",
				""
		);

		SymptomAssessment a = svc.check(1L, new SymptomCheckRequest("fever and sore throat", 28, 2));
		assertNotNull(a);
		assertNotNull(a.getRecommendedSpecialties());
		assertTrue(a.getRecommendedSpecialties().contains("ENT"), "Expected ENT to be recommended");
	}

	@Test
	void parseRecommendedSpecialties_deduplicates_and_limits() {
		var parsed = SymptomCheckerAppService.parseRecommendedSpecialties("ENT, ENT, Cardiology, Neurology, Dermatology, Gastroenterology");
		assertTrue(parsed.contains("ENT"));
		assertTrue(parsed.size() <= 5);
	}
}
