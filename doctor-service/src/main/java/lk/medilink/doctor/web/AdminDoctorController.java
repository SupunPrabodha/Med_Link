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

	@PostMapping("/{doctorId}/approve")
	public DoctorProfile approve(@PathVariable("doctorId") Long doctorId) {
		return service.approve(doctorId);
	}

	@PostMapping("/{doctorId}/reject")
	public DoctorProfile reject(@PathVariable("doctorId") Long doctorId, @Valid @RequestBody RejectDoctorRequest req) {
		return service.reject(doctorId, req.reason());
	}
}
