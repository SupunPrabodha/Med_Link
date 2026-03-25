package lk.medilink.appointment.messaging;

import java.time.Instant;

public final class AppointmentEvents {
	private AppointmentEvents() {
	}

	public record AppointmentCreated(Long appointmentId, Long patientId, Long doctorId, Instant slotTime) {
	}

	public record AppointmentCancelled(Long appointmentId, Long patientId, Long doctorId, Instant slotTime) {
	}
}

