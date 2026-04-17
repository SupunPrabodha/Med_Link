package lk.medilink.notification.messaging;

import lk.medilink.notification.delivery.NotificationDeliveryService;
import lk.medilink.notification.store.NotificationStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class ConsultationEventHandlers {
	private static final Logger log = LoggerFactory.getLogger(ConsultationEventHandlers.class);

	private final NotificationStore store;
	private final NotificationDeliveryService delivery;

	public ConsultationEventHandlers(NotificationStore store, NotificationDeliveryService delivery) {
		this.store = store;
		this.delivery = delivery;
	}

	public record ConsultationCompleted(Long appointmentId, Long patientId, Long doctorId, Instant slotTime, Instant completedAt) {
	}

	@RabbitListener(queues = "notification.consultation.completed")
	public void onCompleted(ConsultationCompleted event) {
		log.info("[NOTIFY] Consultation completed: {}", event);

		String patientMsg = "Consultation for appointment #" + event.appointmentId() + " completed";
		store.add("consultation.completed", patientMsg, event.patientId());
		delivery.deliverToPatientUser(event.patientId(), "Consultation completed", patientMsg);

		String doctorMsg = "Consultation for appointment #" + event.appointmentId() + " completed";
		Long doctorUserId = delivery.deliverToDoctorId(event.doctorId(), "Consultation completed", doctorMsg);
		if (doctorUserId != null) {
			store.add("consultation.completed", doctorMsg, doctorUserId);
		}
	}
}
