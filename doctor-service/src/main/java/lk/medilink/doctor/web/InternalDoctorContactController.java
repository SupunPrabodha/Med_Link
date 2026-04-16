package lk.medilink.doctor.web;

import lk.medilink.doctor.domain.DoctorProfile;
import lk.medilink.doctor.repo.DoctorProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
@RequestMapping("/internal/doctors")
public class InternalDoctorContactController {
	private final DoctorProfileRepository profiles;
	private final String internalToken;

	public InternalDoctorContactController(DoctorProfileRepository profiles,
	                                      @Value("${app.internal-token:}") String internalToken) {
		this.profiles = profiles;
		this.internalToken = internalToken == null ? "" : internalToken;
	}

	@GetMapping("/{doctorId}/contact")
	public DoctorContact contactByDoctorId(@RequestHeader(value = "X-Internal-Token", required = false) String token,
	                                      @PathVariable("doctorId") Long doctorId) {
		requireInternalToken(token);
		if (doctorId == null || doctorId <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid doctorId");
		}
		DoctorProfile p = profiles.findById(doctorId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor profile not found"));
		return new DoctorContact(p.getId(), p.getUserId(), p.getFullName(), p.getPhone(), p.getProfilePhotoUrl());
	}

	@GetMapping("/by-user/{userId}/contact")
	public DoctorContact contactByUserId(@RequestHeader(value = "X-Internal-Token", required = false) String token,
	                                    @PathVariable("userId") Long userId) {
		requireInternalToken(token);
		if (userId == null || userId <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid userId");
		}
		DoctorProfile p = profiles.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor profile not found"));
		return new DoctorContact(p.getId(), p.getUserId(), p.getFullName(), p.getPhone(), p.getProfilePhotoUrl());
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

	public record DoctorContact(Long doctorId, Long userId, String fullName, String phone, String profilePhotoUrl) {
	}
}
