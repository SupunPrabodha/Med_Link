package lk.medilink.telemedicine.web;

import lk.medilink.telemedicine.domain.TelemedicineSession;
import lk.medilink.telemedicine.service.TelemedicineAppService;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/telemedicine")
public class TelemedicineController {
	private final TelemedicineAppService service;

	public TelemedicineController(TelemedicineAppService service) {
		this.service = service;
	}

	public record TelemedicineSessionResponse(
			Long appointmentId,
			Instant slotTime,
			String roomName,
			String joinUrl,
			String status
	) {
	}

	@GetMapping("/sessions/appointment/{appointmentId}")
	public TelemedicineSessionResponse getByAppointment(
			@RequestHeader("X-User-Id") Long requesterUserId,
			@RequestHeader(value = "X-User-Role", required = false) String roles,
			@PathVariable("appointmentId") Long appointmentId
	) {
		TelemedicineSession s = service.getSessionForAppointment(appointmentId, requesterUserId, roles);
		return new TelemedicineSessionResponse(
				s.getAppointmentId(),
				s.getSlotTime(),
				s.getRoomName(),
				s.getJoinUrl(),
				s.getStatus().name()
		);
	}

	@GetMapping("/ping")
	public String ping() {
		return "telemedicine-service @ " + Instant.now();
	}
}
