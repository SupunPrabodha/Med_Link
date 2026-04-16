package lk.medilink.symptomchecker.web;

import lk.medilink.symptomchecker.service.SymptomCheckerAppService;
import lk.medilink.symptomchecker.web.dto.SymptomCheckResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/symptoms")
public class AdminSymptomCheckerController {
	private final SymptomCheckerAppService service;

	public AdminSymptomCheckerController(SymptomCheckerAppService service) {
		this.service = service;
	}

	@GetMapping
	public List<SymptomCheckResponse> recent(
			@RequestHeader(value = "X-User-Role", required = false) String roles
	) {
		if (!hasRole(roles, "ADMIN")) {
			throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
		}
		return service.recentAll().stream()
				.map(a -> new SymptomCheckResponse(a.getId(), a.getCreatedAt(), a.getRiskLevel(), a.getSummary(), a.getAdvice()))
				.toList();
	}

	private static boolean hasRole(String rolesHeader, String role) {
		if (rolesHeader == null || rolesHeader.isBlank()) return false;
		for (String r : rolesHeader.split(",")) {
			if (role.equalsIgnoreCase(r.trim())) return true;
		}
		return false;
	}
}
