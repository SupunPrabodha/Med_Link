package lk.medilink.appointment.web;

import lk.medilink.appointment.domain.Appointment;
import lk.medilink.appointment.domain.AppointmentStatus;
import lk.medilink.appointment.service.AppointmentAppService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/appointments")
public class AdminAppointmentController {
	private final AppointmentAppService service;

	public AdminAppointmentController(AppointmentAppService service) {
		this.service = service;
	}

	@GetMapping
	public List<Appointment> all(@RequestParam(value = "patientId", required = false) Long patientId,
	                            @RequestParam(value = "doctorId", required = false) Long doctorId,
	                            @RequestParam(value = "status", required = false) AppointmentStatus status) {
		return service.listAll().stream()
				.filter(a -> patientId == null || patientId.equals(a.getPatientId()))
				.filter(a -> doctorId == null || doctorId.equals(a.getDoctorId()))
				.filter(a -> status == null || status == a.getStatus())
				.toList();
	}

	@DeleteMapping("/{id}")
	public Appointment cancel(@RequestHeader("X-User-Id") Long adminUserId,
	                         @PathVariable("id") Long id) {
		return service.cancel(id, adminUserId, true);
	}
}
