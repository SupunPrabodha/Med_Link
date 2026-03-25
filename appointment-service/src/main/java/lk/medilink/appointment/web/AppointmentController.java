package lk.medilink.appointment.web;

import jakarta.validation.Valid;
import lk.medilink.appointment.domain.Appointment;
import lk.medilink.appointment.service.AppointmentAppService;
import lk.medilink.appointment.web.dto.CreateAppointmentRequest;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {
	private final AppointmentAppService service;

	public AppointmentController(AppointmentAppService service) {
		this.service = service;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public Appointment create(@RequestHeader("X-User-Id") Long patientId,
	                         @Valid @RequestBody CreateAppointmentRequest req) {
		return service.create(patientId, req.doctorId(), req.slotTime());
	}

	@GetMapping
	public List<Appointment> myAppointments(@RequestHeader("X-User-Id") Long patientId) {
		return service.listForPatient(patientId);
	}

	@DeleteMapping("/{id}")
	public Appointment cancel(@RequestHeader("X-User-Id") Long patientId,
	                        @RequestHeader(value = "X-User-Role", required = false) String roles,
	                        @PathVariable("id") Long id) {
		boolean admin = roles != null && roles.contains("ADMIN");
		return service.cancel(id, patientId, admin);
	}

	@GetMapping("/ping")
	public String ping() {
		return "appointment-service @ " + Instant.now();
	}
}

