package lk.medilink.telemedicine.messaging;

import java.time.Instant;

public final class ConsultationEvents {
	private ConsultationEvents() {
	}

	public record ConsultationCompleted(Long appointmentId, Long patientId, Long doctorId, Instant slotTime, Instant completedAt) {
	}
}
