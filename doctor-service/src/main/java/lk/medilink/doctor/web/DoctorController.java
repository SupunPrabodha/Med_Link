package lk.medilink.doctor.web;

import jakarta.validation.Valid;
import lk.medilink.doctor.domain.DoctorAvailabilityBlock;
import lk.medilink.doctor.domain.DoctorProfile;
import lk.medilink.doctor.service.DoctorAppService;
import lk.medilink.doctor.web.dto.AvailabilityValidationResponse;
import lk.medilink.doctor.web.dto.UpsertDoctorAvailabilityRequest;
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

	@GetMapping("/me/availability")
	public List<DoctorAvailabilityBlock> myAvailability(@RequestHeader("X-User-Id") Long userId) {
		return service.getMyAvailability(userId);
	}

	@PutMapping("/me/availability")
	public List<DoctorAvailabilityBlock> setMyAvailability(@RequestHeader("X-User-Id") Long userId,
	                                                      @Valid @RequestBody UpsertDoctorAvailabilityRequest req) {
		return service.setMyAvailability(userId, req.blocks());
	}

	@GetMapping
	public List<DoctorProfile> search(@RequestParam(value = "specialization", required = false) String specialization) {
		return service.searchVerified(specialization);
	}

	@GetMapping("/{doctorId}/availability")
	public List<DoctorAvailabilityBlock> availability(@PathVariable("doctorId") Long doctorId) {
		return service.getAvailability(doctorId);
	}

	@GetMapping("/{doctorId}/availability/slots")
	public List<Instant> slots(@PathVariable("doctorId") Long doctorId,
	                          @RequestParam(value = "days", required = false, defaultValue = "14") int days) {
		return service.generateSlots(doctorId, days);
	}

	@GetMapping("/{doctorId}/availability/validate")
	public AvailabilityValidationResponse validate(@PathVariable("doctorId") Long doctorId,
	                                             @RequestParam("slotTime") Instant slotTime) {
		return new AvailabilityValidationResponse(service.isSlotAllowed(doctorId, slotTime));
	}

	@GetMapping("/ping")
	public String ping() {
		return "doctor-service @ " + Instant.now();
	}
}
