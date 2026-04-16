package lk.medilink.patient.web;

import lk.medilink.patient.domain.PatientProfile;
import lk.medilink.patient.repo.PatientProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
@RequestMapping("/internal/patients")
public class InternalPatientContactController {
	private final PatientProfileRepository profiles;
	private final String internalToken;

	public InternalPatientContactController(PatientProfileRepository profiles,
	                                       @Value("${app.internal-token:}") String internalToken) {
		this.profiles = profiles;
		this.internalToken = internalToken == null ? "" : internalToken;
	}

	@GetMapping("/{userId}/contact")
	public PatientContact contact(@RequestHeader(value = "X-Internal-Token", required = false) String token,
	                             @PathVariable("userId") Long userId) {
		requireInternalToken(token);
		if (userId == null || userId <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid userId");
		}
		PatientProfile p = profiles.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient profile not found"));
		return new PatientContact(p.getUserId(), p.getFullName(), p.getPhone(), p.getProfilePhotoUrl());
	}

	private void requireInternalToken(String token) {
		if (internalToken.isBlank()) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Internal API is not configured");
		}
		String provided = token == null ? "" : token;
		boolean ok = MessageDigest.isEqual(
				internalToken.getBytes(StandardCharsets.UTF_8),
				provided.getBytes(StandardCharsets.UTF_8)
		);
		if (!ok) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
		}
	}

	public record PatientContact(Long userId, String fullName, String phone, String profilePhotoUrl) {
	}
}
