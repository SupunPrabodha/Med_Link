package lk.medilink.symptomchecker.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lk.medilink.symptomchecker.domain.SymptomAssessment;
import lk.medilink.symptomchecker.repo.SymptomAssessmentRepository;
import lk.medilink.symptomchecker.web.dto.SymptomCheckRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Duration;
import java.util.*;

@Service
public class SymptomCheckerAppService {
	private final SymptomAssessmentRepository repo;
	private final RestTemplate rest;
	private final boolean aiEnabled;
	private final String aiBaseUrl;
	private final String aiApiKey;
	private final String aiModel;

	private static final int MAX_SYMPTOMS_LEN = 2000;
	private static final int MAX_SPECIALTIES = 5;

	public SymptomCheckerAppService(
			SymptomAssessmentRepository repo,
			RestTemplateBuilder restBuilder,
			@Value("${app.ai.enabled:false}") boolean aiEnabled,
			@Value("${app.ai.base-url:}") String aiBaseUrl,
			@Value("${app.ai.api-key:}") String aiApiKey,
			@Value("${app.ai.model:}") String aiModel
	) {
		this.repo = repo;
		this.rest = restBuilder
				.setConnectTimeout(Duration.ofSeconds(3))
				.setReadTimeout(Duration.ofSeconds(8))
				.build();
		this.aiEnabled = aiEnabled;
		this.aiBaseUrl = aiBaseUrl == null ? "" : aiBaseUrl.trim();
		this.aiApiKey = aiApiKey == null ? "" : aiApiKey.trim();
		this.aiModel = aiModel == null ? "" : aiModel.trim();
	}

	@Transactional
	public SymptomAssessment check(Long userId, SymptomCheckRequest req) {
		if (userId == null || userId <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid user");
		}
		if (req == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid request");
		}

		String symptoms = req.symptoms() == null ? "" : req.symptoms().trim();
		if (symptoms.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Symptoms are required");
		}
		if (symptoms.length() > MAX_SYMPTOMS_LEN) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Symptoms are too long");
		}

		Integer age = req.age();
		if (age != null && (age < 0 || age > 120)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid age");
		}

		Integer durationDays = req.durationDays();
		if (durationDays != null && (durationDays < 0 || durationDays > 365)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid duration");
		}

		String normalized = symptoms.toLowerCase(Locale.ROOT);
		TriageResult result = triage(normalized, age, durationDays);

		List<String> baseline = recommendSpecialtiesHeuristic(normalized, age);
		List<String> specialties = "EMERGENCY".equals(result.riskLevel)
				? baseline
				: maybeRecommendSpecialtiesWithAi(symptoms, age, durationDays, baseline);
		String specialtiesCsv = String.join(",", specialties);

		SymptomAssessment a = new SymptomAssessment(
				userId,
				symptoms,
				age,
				durationDays,
				result.riskLevel,
				result.summary,
				result.advice,
				specialtiesCsv
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
					"The symptoms you described may require urgent medical attention.",
					"If you feel unsafe, your symptoms are severe, or they are rapidly worsening, call your local emergency number now. " +
							"If you are unsure, seek urgent medical care promptly. This tool provides educational information only and does not provide a diagnosis."
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
			case "HIGH" -> "Based on the information provided, your symptoms may warrant prompt clinical assessment.";
			case "MEDIUM" -> "Based on the information provided, your symptoms may warrant medical advice if they persist or worsen.";
			default -> "Based on what you entered, your symptoms appear mild at this time.";
		};

		String advice = switch (risk) {
			case "HIGH" -> "Consider seeking medical care today, especially if symptoms are worsening, you feel very unwell, " +
						"or you have significant underlying conditions. If you develop chest pain, severe breathing trouble, confusion, " +
						"fainting, or severe bleeding, seek emergency care immediately. This tool provides educational information only and does not provide a diagnosis.";
			case "MEDIUM" -> "Rest, stay hydrated, and monitor your symptoms. If symptoms last more than a few days, worsen, " +
						"or new concerning symptoms develop, seek medical advice. This tool provides educational information only and does not provide a diagnosis.";
			default -> "If symptoms persist, worsen, or you are concerned, consult a clinician. If severe symptoms appear, seek urgent care. " +
						"This tool provides educational information only and does not provide a diagnosis.";
		};

		return new TriageResult(risk, summary, advice);
	}

	public static List<String> parseRecommendedSpecialties(String csv) {
		if (csv == null || csv.isBlank()) return List.of();
		LinkedHashSet<String> out = new LinkedHashSet<>();
		for (String part : csv.split(",")) {
			if (part == null) continue;
			String s = part.trim();
			if (s.isEmpty()) continue;
			if (s.length() > 80) s = s.substring(0, 80);
			out.add(s);
			if (out.size() >= MAX_SPECIALTIES) break;
		}
		return List.copyOf(out);
	}

	private static List<String> recommendSpecialtiesHeuristic(String normalizedSymptoms, Integer age) {
		if (containsAny(normalizedSymptoms,
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
		)) {
			return List.of("Emergency Medicine");
		}

		LinkedHashSet<String> out = new LinkedHashSet<>();

		if (age != null && age >= 0 && age < 16) out.add("Pediatrics");
		out.add("General Medicine");

		if (containsAny(normalizedSymptoms, "cough", "sore throat", "sinus", "ear pain", "runny nose")) {
			out.add("ENT");
		}
		if (containsAny(normalizedSymptoms, "rash", "itch", "hives", "swelling")) {
			out.add("Dermatology");
		}
		if (containsAny(normalizedSymptoms, "headache", "migraine", "dizzy", "dizziness", "faint")) {
			out.add("Neurology");
		}
		if (containsAny(normalizedSymptoms, "stomach", "abdominal", "diarrhea", "vomiting", "nausea")) {
			out.add("Gastroenterology");
		}
		if (containsAny(normalizedSymptoms, "chest", "palpitations")) {
			out.add("Cardiology");
		}
		if (containsAny(normalizedSymptoms, "anxious", "anxiety", "panic", "depressed", "depression")) {
			out.add("Psychiatry");
		}
		if (containsAny(normalizedSymptoms, "injury", "fracture", "sprain", "joint pain", "back pain")) {
			out.add("Orthopedics");
		}

		List<String> list = new ArrayList<>(out);
		if (list.size() > MAX_SPECIALTIES) list = list.subList(0, MAX_SPECIALTIES);
		return List.copyOf(list);
	}

	private List<String> maybeRecommendSpecialtiesWithAi(
			String symptoms,
			Integer age,
			Integer durationDays,
			List<String> baseline
	) {
		List<String> baselineClean = cleanSpecialties(baseline);
		if (baselineClean.isEmpty()) baselineClean = List.of("General Medicine");

		if (!aiEnabled) return baselineClean;
		if (aiBaseUrl.isBlank()) return baselineClean;

		URI base;
		try {
			base = URI.create(aiBaseUrl);
		} catch (IllegalArgumentException ex) {
			return baselineClean;
		}

		String scheme = base.getScheme();
		if (scheme == null || (!scheme.equalsIgnoreCase("http") && !scheme.equalsIgnoreCase("https"))) return baselineClean;
		if (base.getHost() == null || base.getHost().isBlank()) return baselineClean;
		if (base.getUserInfo() != null) return baselineClean;
		if (base.getQuery() != null) return baselineClean;
		if (base.getFragment() != null) return baselineClean;

		URI url = UriComponentsBuilder.fromUri(base)
				.path("/recommend-specialties")
				.build(true)
				.toUri();

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);
		headers.setAccept(List.of(MediaType.APPLICATION_JSON));
		if (!aiApiKey.isBlank()) {
			headers.set("X-API-Key", aiApiKey);
		}

		AiSpecialtyRequest body = new AiSpecialtyRequest(symptoms, age, durationDays, baselineClean, aiModel.isBlank() ? null : aiModel);
		HttpEntity<AiSpecialtyRequest> entity = new HttpEntity<>(body, headers);

		try {
			ResponseEntity<AiSpecialtyResponse> resp = rest.exchange(url, HttpMethod.POST, entity, AiSpecialtyResponse.class);
			AiSpecialtyResponse r = resp.getBody();
			List<String> ai = r == null ? null : r.specialties();
			List<String> cleaned = cleanSpecialties(ai);
			return cleaned.isEmpty() ? baselineClean : cleaned;
		} catch (RestClientException ex) {
			return baselineClean;
		}
	}

	private static List<String> cleanSpecialties(List<String> in) {
		if (in == null || in.isEmpty()) return List.of();
		LinkedHashSet<String> out = new LinkedHashSet<>();
		for (String s : in) {
			if (s == null) continue;
			String t = s.trim().replace(",", " ");
			if (t.isBlank()) continue;
			t = t.replaceAll("\\s{2,}", " ").trim();
			if (t.length() > 80) t = t.substring(0, 80);
			out.add(t);
			if (out.size() >= MAX_SPECIALTIES) break;
		}
		return List.copyOf(out);
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	private record AiSpecialtyRequest(String symptoms, Integer age, Integer durationDays, List<String> baseline, String model) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	private record AiSpecialtyResponse(List<String> specialties) {
	}

	private static boolean containsAny(String haystack, String... needles) {
		if (haystack == null || haystack.isBlank()) return false;
		for (String n : needles) {
			if (n != null && !n.isBlank() && haystack.contains(n)) return true;
		}
		return false;
	}
}
