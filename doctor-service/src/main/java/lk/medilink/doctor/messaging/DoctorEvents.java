package lk.medilink.doctor.messaging;

import java.time.Instant;

public final class DoctorEvents {
	private DoctorEvents() {
	}

	public record DoctorVerified(Long doctorId, Long userId, String specialization, Instant verifiedAt) {
	}

	public record DoctorRejected(Long doctorId, Long userId, String reason, Instant rejectedAt) {
	}
}

