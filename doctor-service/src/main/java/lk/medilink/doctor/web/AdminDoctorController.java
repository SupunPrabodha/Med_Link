package lk.medilink.doctor.web;

import jakarta.validation.Valid;
import lk.medilink.doctor.domain.DoctorProfile;
import lk.medilink.doctor.service.DoctorAppService;
import lk.medilink.doctor.web.dto.RejectDoctorRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/doctors")
public class AdminDoctorController {
	private final DoctorAppService service;

	public AdminDoctorController(DoctorAppService service) {
		this.service = service;
	}

	@GetMapping("/pending")
	public List<DoctorProfile> pending() {
		return service.pending();
	}

	@GetMapping("/recent-decisions")
	public List<DoctorProfile> recentDecisions() {
		return service.recentDecisions();
	}

	@PostMapping("/{doctorId}/approve")
	public DoctorProfile approve(@RequestHeader("X-User-Id") Long adminUserId,
	                            @PathVariable("doctorId") Long doctorId) {
		return service.approve(doctorId, adminUserId);
	}

	@PostMapping("/{doctorId}/reject")
	public DoctorProfile reject(@RequestHeader("X-User-Id") Long adminUserId,
	                           @PathVariable("doctorId") Long doctorId,
	                           @Valid @RequestBody RejectDoctorRequest req) {
		return service.reject(doctorId, adminUserId, req.reason());
	}

	@DeleteMapping("/{doctorId}")
	public void deleteDoctor(@RequestHeader("X-User-Id") Long adminUserId,
	                         @PathVariable("doctorId") Long doctorId) {
		service.adminDeleteDoctor(doctorId, adminUserId);
	}
}
