package lk.medilink.telemedicine.web;

import lk.medilink.telemedicine.service.ConsultationSessionService;
import lk.medilink.telemedicine.web.dto.ConsultationJoinResponse;
import lk.medilink.telemedicine.web.dto.ConsultationSessionSummaryResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/telemedicine")
public class TelemedicineController {

	private final ConsultationSessionService sessions;

	public TelemedicineController(ConsultationSessionService sessions) {
		this.sessions = sessions;
	}

	@PostMapping("/sessions/{sessionId}/join")
	public ConsultationJoinResponse join(@RequestHeader("X-User-Id") Long userId,
	                                    @PathVariable("sessionId") Long sessionId) {
		return sessions.issueJoinAccess(sessionId, userId);
	}

	@GetMapping("/me/sessions")
	public java.util.List<ConsultationSessionSummaryResponse> mySessions(@RequestHeader("X-User-Id") Long userId) {
		return sessions.listSessionsForUser(userId);
	}

	@GetMapping("/ping")
	public String ping() {
		return "telemedicine-service @ " + Instant.now();
	}
}