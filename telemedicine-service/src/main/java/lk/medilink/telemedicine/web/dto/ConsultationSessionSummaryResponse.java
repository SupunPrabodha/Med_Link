package lk.medilink.telemedicine.web.dto;

import java.time.Instant;

public record ConsultationSessionSummaryResponse(
		Long sessionId,
		Long appointmentId,
		Long doctorUserId,
		Long patientUserId,
		String roomId,
		Instant scheduledStartTime,
		String sessionStatus,
		String participantRole,
		boolean joinable,
		Instant joinOpensAt,
		Instant joinClosesAt
) {
}