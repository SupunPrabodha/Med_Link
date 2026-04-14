package lk.medilink.appointment.web;

import jakarta.validation.Valid;
import lk.medilink.appointment.domain.Appointment;
import lk.medilink.appointment.service.AppointmentAppService;
import lk.medilink.appointment.web.dto.CreateAppointmentRequest;
import lk.medilink.appointment.web.dto.UpdateAppointmentApprovalRequest;
import org.springframework.http.ResponseEntity;
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

	@GetMapping("/doctor/me")
	public List<Appointment> myDoctorAppointments(@RequestHeader("X-User-Id") Long doctorUserId) {
		return service.listForDoctorUser(doctorUserId);
	}

	@PutMapping("/doctor/me/{id}/approval")
	public Appointment updateDoctorAppointmentApproval(@RequestHeader("X-User-Id") Long doctorUserId,
	                                                  @PathVariable("id") Long appointmentId,
	                                                  @Valid @RequestBody UpdateAppointmentApprovalRequest req) {
		return service.updateApprovalForDoctorUser(appointmentId, doctorUserId, req.appoinmentApproval());
	}

	@GetMapping("/doctor/me/patients")
	public List<AppointmentAppService.DoctorPatientWithReportsResponse> myConfirmedPatientsWithReports(
			@RequestHeader("X-User-Id") Long doctorUserId
	) {
		return service.listConfirmedPatientsWithReportsForDoctorUser(doctorUserId);
	}

	@GetMapping("/doctor/me/patients/{patientId}/reports/{reportId}/download")
	public ResponseEntity<byte[]> downloadPatientReportForDoctor(
			@RequestHeader("X-User-Id") Long doctorUserId,
			@PathVariable("patientId") Long patientId,
			@PathVariable("reportId") Long reportId
	) {
		return service.downloadPatientReportForDoctorUser(doctorUserId, patientId, reportId);
	}

	@GetMapping("/available-slots")
	public List<Instant> availableSlots(@RequestParam("doctorId") Long doctorId,
	                                  @RequestParam(value = "days", required = false, defaultValue = "14") int days) {
		return service.availableSlots(doctorId, days);
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

