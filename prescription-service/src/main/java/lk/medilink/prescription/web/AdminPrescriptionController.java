package lk.medilink.prescription.web;

import lk.medilink.prescription.domain.Prescription;
import lk.medilink.prescription.service.PrescriptionAppService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/prescriptions")
public class AdminPrescriptionController {
	private final PrescriptionAppService service;

	public AdminPrescriptionController(PrescriptionAppService service) {
		this.service = service;
	}

	@GetMapping
	public List<Prescription> listAll() {
		return service.listAll();
	}
}
