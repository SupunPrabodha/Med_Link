package lk.medilink.prescription.web;

import jakarta.validation.Valid;
import lk.medilink.prescription.domain.Prescription;
import lk.medilink.prescription.service.PrescriptionAppService;
import lk.medilink.prescription.web.dto.CreatePrescriptionRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/prescriptions")
public class PrescriptionController {
	private final PrescriptionAppService service;

	public PrescriptionController(PrescriptionAppService service) {
		this.service = service;
	}

	@PostMapping("/doctor/me")
	@ResponseStatus(HttpStatus.CREATED)
	public Prescription issue(@RequestHeader("X-User-Id") Long doctorUserId,
	                         @RequestHeader(value = "X-User-Role", required = false) String roles,
	                         @Valid @RequestBody CreatePrescriptionRequest req) {
		if (!hasRole(roles, "DOCTOR") && !hasRole(roles, "ADMIN")) {
			throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
		}
		return service.issue(doctorUserId, req);
	}

	@GetMapping("/doctor/me")
	public List<Prescription> myIssued(@RequestHeader("X-User-Id") Long doctorUserId,
	                                  @RequestHeader(value = "X-User-Role", required = false) String roles) {
		if (!hasRole(roles, "DOCTOR") && !hasRole(roles, "ADMIN")) {
			return List.of();
		}
		return service.listForDoctor(doctorUserId);
	}

	@GetMapping("/patient/me")
	public List<Prescription> myPrescriptions(@RequestHeader("X-User-Id") Long patientUserId,
	                                         @RequestHeader(value = "X-User-Role", required = false) String roles) {
		if (!hasRole(roles, "PATIENT") && !hasRole(roles, "ADMIN")) {
			return List.of();
		}
		return service.listForPatient(patientUserId);
	}

	@GetMapping("/{id}")
	public Prescription get(@RequestHeader("X-User-Id") Long userId,
	                        @RequestHeader(value = "X-User-Role", required = false) String roles,
	                        @PathVariable("id") Long id) {
		boolean admin = hasRole(roles, "ADMIN");
		return service.getForUser(id, userId, admin);
	}

	@GetMapping("/ping")
	public String ping() {
		return "prescription-service @ " + Instant.now();
	}

	private static boolean hasRole(String rolesHeader, String role) {
		if (rolesHeader == null || rolesHeader.isBlank()) return false;
		for (String r : rolesHeader.split(",")) {
			if (role.equalsIgnoreCase(r.trim())) return true;
		}
		return false;
	}
}
