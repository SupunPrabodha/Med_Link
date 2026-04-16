package lk.medilink.notification.messaging;

import lk.medilink.notification.delivery.NotificationDeliveryService;
import lk.medilink.notification.store.NotificationStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class AppointmentEventHandlers {
	private static final Logger log = LoggerFactory.getLogger(AppointmentEventHandlers.class);
	private final NotificationStore store;
	private final NotificationDeliveryService delivery;

	public AppointmentEventHandlers(NotificationStore store,
	                               NotificationDeliveryService delivery) {
		this.store = store;
		this.delivery = delivery;
	}

	public record AppointmentCreated(Long appointmentId, Long patientId, Long doctorId, Instant slotTime) {
	}

	public record AppointmentCancelled(Long appointmentId, Long patientId, Long doctorId, Instant slotTime) {
	}

	public record AppointmentConfirmed(Long appointmentId, Long patientId, Long doctorId, Instant slotTime, Instant confirmedAt) {
	}

	@RabbitListener(queues = "notification.appointment.created")
	public void onCreated(AppointmentCreated event) {
		log.info("[NOTIFY] Appointment created: {}", event);

		String patientMsg = "Appointment #" + event.appointmentId() + " created for " + event.slotTime();
		store.add("appointment.created", patientMsg, event.patientId());
		delivery.deliverToPatientUser(event.patientId(), "Appointment created", patientMsg);

		String doctorMsg = "New appointment #" + event.appointmentId() + " booked for " + event.slotTime();
		Long doctorUserId = delivery.deliverToDoctorId(event.doctorId(), "New appointment booked", doctorMsg);
		if (doctorUserId != null) {
			store.add("appointment.created", doctorMsg, doctorUserId);
		}
	}

	@RabbitListener(queues = "notification.appointment.cancelled")
	public void onCancelled(AppointmentCancelled event) {
		log.info("[NOTIFY] Appointment cancelled: {}", event);

		String patientMsg = "Appointment #" + event.appointmentId() + " cancelled";
		store.add("appointment.cancelled", patientMsg, event.patientId());
		delivery.deliverToPatientUser(event.patientId(), "Appointment cancelled", patientMsg);

		String doctorMsg = "Appointment #" + event.appointmentId() + " was cancelled";
		Long doctorUserId = delivery.deliverToDoctorId(event.doctorId(), "Appointment cancelled", doctorMsg);
		if (doctorUserId != null) {
			store.add("appointment.cancelled", doctorMsg, doctorUserId);
		}
	}

	@RabbitListener(queues = "notification.appointment.confirmed")
	public void onConfirmed(AppointmentConfirmed event) {
		log.info("[NOTIFY] Appointment confirmed: {}", event);

		String patientMsg = "Appointment #" + event.appointmentId() + " confirmed";
		store.add("appointment.confirmed", patientMsg, event.patientId());
		delivery.deliverToPatientUser(event.patientId(), "Appointment confirmed", patientMsg);

		String doctorMsg = "Appointment #" + event.appointmentId() + " confirmed";
		Long doctorUserId = delivery.deliverToDoctorId(event.doctorId(), "Appointment confirmed", doctorMsg);
		if (doctorUserId != null) {
			store.add("appointment.confirmed", doctorMsg, doctorUserId);
		}
	}
}
