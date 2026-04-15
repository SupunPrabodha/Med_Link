package lk.medilink.telemedicine.web.dto;

import java.time.Instant;

public record ConsultationJoinResponse(
		Long sessionId,
		Long appointmentId,
		Long doctorUserId,
		Long patientUserId,
		String roomId,
		String meetingUrl,
		String jitsiDomain,
		String joinToken,
		String role,
		String displayName,
		Instant scheduledStartTime,
		Instant tokenExpiresAt,
		String sessionStatus
) {
}