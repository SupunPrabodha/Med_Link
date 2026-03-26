package lk.medilink.doctor.web;

import jakarta.validation.Valid;
import lk.medilink.doctor.domain.DoctorProfile;
import lk.medilink.doctor.service.DoctorAppService;
import lk.medilink.doctor.web.dto.UpsertDoctorProfileRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {
	private final DoctorAppService service;

	public DoctorController(DoctorAppService service) {
		this.service = service;
	}

	@PostMapping("/me/profile")
	@ResponseStatus(HttpStatus.CREATED)
	public DoctorProfile upsertProfile(@RequestHeader("X-User-Id") Long userId,
	                                 @Valid @RequestBody UpsertDoctorProfileRequest req) {
		return service.upsertProfile(userId, req.fullName(), req.registrationNo(), req.specialization(), req.documentsUrl());
	}

	@GetMapping("/me/profile")
	public DoctorProfile myProfile(@RequestHeader("X-User-Id") Long userId) {
		return service.getOwn(userId);
	}

	@GetMapping
	public List<DoctorProfile> search(@RequestParam(value = "specialization", required = false) String specialization) {
		return service.searchVerified(specialization);
	}

	@GetMapping("/ping")
	public String ping() {
		return "doctor-service @ " + Instant.now();
	}
}
