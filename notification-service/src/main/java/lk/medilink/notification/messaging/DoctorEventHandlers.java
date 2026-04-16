package lk.medilink.notification.messaging;

import lk.medilink.notification.delivery.NotificationDeliveryService;
import lk.medilink.notification.store.NotificationStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class DoctorEventHandlers {
	private static final Logger log = LoggerFactory.getLogger(DoctorEventHandlers.class);
	private final NotificationStore store;
	private final NotificationDeliveryService delivery;

	public DoctorEventHandlers(NotificationStore store,
	                          NotificationDeliveryService delivery) {
		this.store = store;
		this.delivery = delivery;
	}

	public record DoctorVerified(Long doctorId, Long userId, String specialization, Instant verifiedAt) {
	}

	public record DoctorRejected(Long doctorId, Long userId, String reason, Instant rejectedAt) {
	}

	@RabbitListener(queues = "notification.doctor.verified")
	public void onVerified(DoctorVerified e) {
		log.info("[NOTIFY] Doctor verified: {}", e);
		String msg = "Your doctor profile was verified (" + e.specialization() + ")";
		store.add("doctor.verified", msg, e.userId());
		delivery.deliverToDoctorUser(e.userId(), "Doctor profile verified", msg);
	}

	@RabbitListener(queues = "notification.doctor.rejected")
	public void onRejected(DoctorRejected e) {
		log.info("[NOTIFY] Doctor rejected: {}", e);
		String reason = (e.reason() == null || e.reason().isBlank()) ? "Not specified" : e.reason();
		String msg = "Your doctor profile was rejected: " + reason;
		store.add("doctor.rejected", msg, e.userId());
		delivery.deliverToDoctorUser(e.userId(), "Doctor profile rejected", msg);
	}
}

