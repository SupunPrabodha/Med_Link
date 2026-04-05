package lk.medilink.doctor.web;


import jakarta.validation.Valid;
import lk.medilink.doctor.domain.DoctorAvailability;
import lk.medilink.doctor.domain.DoctorProfile;
import lk.medilink.doctor.domain.Prescription;
import lk.medilink.doctor.service.DoctorAppService;
import lk.medilink.doctor.web.dto.CreateAvailabilityRequest;
import lk.medilink.doctor.web.dto.CreatePrescriptionRequest;
import lk.medilink.doctor.web.dto.DecisionRequest;
import lk.medilink.doctor.web.dto.UpdateAvailabilityRequest;
import lk.medilink.doctor.web.dto.UpsertDoctorProfileRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
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

	@PostMapping("/me/availability")
	@ResponseStatus(HttpStatus.CREATED)
	public DoctorAvailability addAvailability(@RequestHeader("X-User-Id") Long doctorId,
	                                          @Valid @RequestBody CreateAvailabilityRequest req) {
		return service.addAvailability(doctorId, req);
	}

	@GetMapping("/me/availability")
	public List<DoctorAvailability> myAvailability(@RequestHeader("X-User-Id") Long doctorId) {
		return service.myAvailability(doctorId);
	}

	@GetMapping("/me/availability/day")
	public List<DoctorAvailability> myAvailabilityByDay(@RequestHeader("X-User-Id") Long doctorId,
	                                                    @RequestParam DayOfWeek dayOfWeek) {
		return service.myAvailabilityByDay(doctorId, dayOfWeek);
	}

	@PutMapping("/me/availability/{availabilityId}")
	public DoctorAvailability updateAvailability(@RequestHeader("X-User-Id") Long doctorId,
	                                             @PathVariable Long availabilityId,
	                                             @Valid @RequestBody UpdateAvailabilityRequest req) {
		return service.updateAvailability(doctorId, availabilityId, req);
	}

	@DeleteMapping("/me/availability/{availabilityId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void deleteAvailability(@RequestHeader("X-User-Id") Long doctorId,
	                               @PathVariable Long availabilityId) {
		service.deleteAvailability(doctorId, availabilityId);
	}

	@PostMapping("/me/appointments/{appointmentId}/accept")
	public String acceptAppointment(@RequestHeader("X-User-Id") Long doctorId,
	                                @PathVariable Long appointmentId,
	                                @RequestBody(required = false) DecisionRequest req) {
		return service.acceptAppointment(doctorId, appointmentId, req == null ? new DecisionRequest(null) : req);
	}

	@PostMapping("/me/appointments/{appointmentId}/reject")
	public String rejectAppointment(@RequestHeader("X-User-Id") Long doctorId,
	                                @PathVariable Long appointmentId,
	                                @RequestBody(required = false) DecisionRequest req) {
		return service.rejectAppointment(doctorId, appointmentId, req == null ? new DecisionRequest(null) : req);
	}

	@PostMapping("/me/prescriptions")
	@ResponseStatus(HttpStatus.CREATED)
	public Prescription issuePrescription(@RequestHeader("X-User-Id") Long doctorId,
	                                      @Valid @RequestBody CreatePrescriptionRequest req) {
		return service.issuePrescription(doctorId, req);
	}

	@GetMapping("/me/prescriptions")
	public List<Prescription> myPrescriptions(@RequestHeader("X-User-Id") Long doctorId) {
		return service.myPrescriptions(doctorId);
	}

	@GetMapping("/patients/{patientId}/reports/{appointmentId}")
	public String viewPatientReport(@RequestHeader("X-User-Id") Long doctorId,
	                                @PathVariable Long patientId,
	                                @PathVariable Long appointmentId) {
		return service.viewPatientReport(doctorId, patientId, appointmentId);
	}

	@PostMapping("/me/telemedicine/{appointmentId}/join")
	public String joinTelemedicine(@RequestHeader("X-User-Id") Long doctorId,
	                               @PathVariable Long appointmentId) {
		return service.joinTelemedicineSession(doctorId, appointmentId);
	}

	@GetMapping("/ping")
	public String ping() {
		return "doctor-service @ " + Instant.now();
	}
}