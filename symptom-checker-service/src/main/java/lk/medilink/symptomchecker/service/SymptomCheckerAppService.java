package lk.medilink.symptomchecker.service;

import lk.medilink.symptomchecker.domain.SymptomAssessment;
import lk.medilink.symptomchecker.repo.SymptomAssessmentRepository;
import lk.medilink.symptomchecker.web.dto.SymptomCheckRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

@Service
public class SymptomCheckerAppService {
	private final SymptomAssessmentRepository repo;

	public SymptomCheckerAppService(SymptomAssessmentRepository repo) {
		this.repo = repo;
	}

	@Transactional
	public SymptomAssessment check(Long userId, SymptomCheckRequest req) {
		if (userId == null || userId <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid user");
		}

		String symptoms = req.symptoms() == null ? "" : req.symptoms().trim();
		if (symptoms.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Symptoms are required");
		}

		String normalized = symptoms.toLowerCase(Locale.ROOT);
		TriageResult result = triage(normalized, req.age(), req.durationDays());

		SymptomAssessment a = new SymptomAssessment(
				userId,
				symptoms,
				req.age(),
				req.durationDays(),
				result.riskLevel,
				result.summary,
				result.advice
		);
		return repo.save(a);
	}

	public List<SymptomAssessment> historyForUser(Long userId) {
		if (userId == null || userId <= 0) return List.of();
		return repo.findTop20ByUserIdOrderByCreatedAtDesc(userId);
	}

	public List<SymptomAssessment> recentAll() {
		return repo.findTop100ByOrderByCreatedAtDesc();
	}

	public SymptomAssessment getForUser(Long id, Long requesterUserId, boolean admin) {
		SymptomAssessment a = repo.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assessment not found"));
		if (admin) return a;
		if (requesterUserId != null && requesterUserId > 0 && requesterUserId.equals(a.getUserId())) return a;
		throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
	}

	private static class TriageResult {
		final String riskLevel;
		final String summary;
		final String advice;

		TriageResult(String riskLevel, String summary, String advice) {
			this.riskLevel = riskLevel;
			this.summary = summary;
			this.advice = advice;
		}
	}

	private static TriageResult triage(String s, Integer age, Integer durationDays) {
		// IMPORTANT: This is a lightweight educational triage heuristic.
		// It is NOT a diagnosis or medical advice.
		boolean emergency = containsAny(s,
				"chest pain",
				"shortness of breath",
				"difficulty breathing",
				"blue lips",
				"unconscious",
				"seizure",
				"severe bleeding",
				"slurred speech",
				"one-sided weakness",
				"stroke"
		);
		if (emergency) {
			return new TriageResult(
					"EMERGENCY",
					"Some symptoms you entered can be urgent.",
					"If you are in immediate danger or symptoms are severe/worsening, call local emergency services now. " +
							"If unsure, seek urgent medical care immediately. This tool does not provide a diagnosis."
			);
		}

		int score = 0;
		if (containsAny(s, "high fever", "fever", "39", "40")) score += 2;
		if (containsAny(s, "persistent", "worsening", "severe")) score += 2;
		if (containsAny(s, "vomiting", "dehydration")) score += 2;
		if (containsAny(s, "rash", "swelling")) score += 1;
		if (containsAny(s, "pain", "headache")) score += 1;
		if (containsAny(s, "cough", "sore throat")) score += 1;
		if (durationDays != null && durationDays >= 7) score += 1;
		if (age != null && (age < 2 || age >= 65)) score += 1;

		String risk;
		if (score >= 6) risk = "HIGH";
		else if (score >= 3) risk = "MEDIUM";
		else risk = "LOW";

		String summary = switch (risk) {
			case "HIGH" -> "Your symptoms may need prompt medical attention.";
			case "MEDIUM" -> "Your symptoms may need medical advice if they persist or worsen.";
			default -> "Your symptoms sound mild based on what you entered.";
		};

		String advice = switch (risk) {
			case "HIGH" -> "Consider seeking medical care today, especially if symptoms are worsening, you feel very unwell, " +
						"or you have underlying conditions. If you develop chest pain, severe shortness of breath, confusion, " +
						"fainting, or severe bleeding, seek emergency care immediately. This tool does not provide a diagnosis.";
			case "MEDIUM" -> "Monitor symptoms, rest, and stay hydrated. If symptoms last more than a few days, worsen, " +
						"or you develop severe symptoms, seek medical advice. This tool does not provide a diagnosis.";
			default -> "If symptoms persist, worsen, or you are concerned, consult a clinician. If severe symptoms appear, seek urgent care. " +
						"This tool does not provide a diagnosis.";
		};

		return new TriageResult(risk, summary, advice);
	}

	private static boolean containsAny(String haystack, String... needles) {
		if (haystack == null || haystack.isBlank()) return false;
		for (String n : needles) {
			if (n != null && !n.isBlank() && haystack.contains(n)) return true;
		}
		return false;
	}
}
