package lk.medilink.symptomchecker.web;

import jakarta.validation.Valid;
import lk.medilink.symptomchecker.domain.SymptomAssessment;
import lk.medilink.symptomchecker.service.SymptomCheckerAppService;
import lk.medilink.symptomchecker.web.dto.SymptomCheckRequest;
import lk.medilink.symptomchecker.web.dto.SymptomCheckResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/symptoms")
public class SymptomCheckerController {
	private final SymptomCheckerAppService service;

	public SymptomCheckerController(SymptomCheckerAppService service) {
		this.service = service;
	}

	@PostMapping("/check")
	@ResponseStatus(HttpStatus.CREATED)
	public SymptomCheckResponse check(
			@RequestHeader("X-User-Id") Long userId,
			@RequestHeader(value = "X-User-Role", required = false) String roles,
			@Valid @RequestBody SymptomCheckRequest req
	) {
		if (!hasRole(roles, "PATIENT") && !hasRole(roles, "ADMIN")) {
			throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
		}
		SymptomAssessment a = service.check(userId, req);
		return new SymptomCheckResponse(a.getId(), a.getCreatedAt(), a.getRiskLevel(), a.getSummary(), a.getAdvice());
	}

	@GetMapping("/history")
	public List<SymptomCheckResponse> history(
			@RequestHeader("X-User-Id") Long userId,
			@RequestHeader(value = "X-User-Role", required = false) String roles
	) {
		if (!hasRole(roles, "PATIENT") && !hasRole(roles, "ADMIN")) {
			return List.of();
		}
		return service.historyForUser(userId).stream()
				.map(a -> new SymptomCheckResponse(a.getId(), a.getCreatedAt(), a.getRiskLevel(), a.getSummary(), a.getAdvice()))
				.toList();
	}

	@GetMapping("/{id}")
	public SymptomCheckResponse get(
			@RequestHeader("X-User-Id") Long userId,
			@RequestHeader(value = "X-User-Role", required = false) String roles,
			@PathVariable("id") Long id
	) {
		boolean admin = hasRole(roles, "ADMIN");
		SymptomAssessment a = service.getForUser(id, userId, admin);
		return new SymptomCheckResponse(a.getId(), a.getCreatedAt(), a.getRiskLevel(), a.getSummary(), a.getAdvice());
	}

	@GetMapping("/ping")
	public String ping() {
		return "symptom-checker-service @ " + Instant.now();
	}

	private static boolean hasRole(String rolesHeader, String role) {
		if (rolesHeader == null || rolesHeader.isBlank()) return false;
		for (String r : rolesHeader.split(",")) {
			if (role.equalsIgnoreCase(r.trim())) return true;
		}
		return false;
	}
}
