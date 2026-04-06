package lk.medilink.patient.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/patients")
public class PatientController {
	@GetMapping("/ping")
	public String ping() {
		return "patient-service @ " + Instant.now();
	}
}
