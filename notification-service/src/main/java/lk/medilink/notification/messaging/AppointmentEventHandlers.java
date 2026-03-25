package lk.medilink.notification.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class AppointmentEventHandlers {
	private static final Logger log = LoggerFactory.getLogger(AppointmentEventHandlers.class);

	public record AppointmentCreated(Long appointmentId, Long patientId, Long doctorId, Instant slotTime) {
	}

	public record AppointmentCancelled(Long appointmentId, Long patientId, Long doctorId, Instant slotTime) {
	}

	public record AppointmentConfirmed(Long appointmentId, Long patientId, Long doctorId, Instant slotTime, Instant confirmedAt) {
	}

	@RabbitListener(queues = "notification.appointment.created")
	public void onCreated(AppointmentCreated event) {
		log.info("[NOTIFY] Appointment created: {}", event);
	}

	@RabbitListener(queues = "notification.appointment.cancelled")
	public void onCancelled(AppointmentCancelled event) {
		log.info("[NOTIFY] Appointment cancelled: {}", event);
	}

	@RabbitListener(queues = "notification.appointment.confirmed")
	public void onConfirmed(AppointmentConfirmed event) {
		log.info("[NOTIFY] Appointment confirmed: {}", event);
	}
}
