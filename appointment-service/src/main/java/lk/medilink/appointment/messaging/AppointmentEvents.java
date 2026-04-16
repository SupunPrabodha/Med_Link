package lk.medilink.appointment.messaging;

import java.time.Instant;

public final class AppointmentEvents {
	private AppointmentEvents() {
	}

	public record AppointmentCreated(Long appointmentId, Long patientId, Long doctorId, Instant slotTime) {
	}

	public record AppointmentCancelled(Long appointmentId, Long patientId, Long doctorId, Instant slotTime) {
	}

	public record AppointmentConfirmed(Long appointmentId, Long patientId, Long doctorId, Instant slotTime, Instant confirmedAt) {
	}

	public record AppointmentRescheduled(Long appointmentId,
	                                   Long patientId,
	                                   Long doctorId,
	                                   Instant oldSlotTime,
	                                   Instant newSlotTime,
	                                   Instant rescheduledAt) {
	}
}
