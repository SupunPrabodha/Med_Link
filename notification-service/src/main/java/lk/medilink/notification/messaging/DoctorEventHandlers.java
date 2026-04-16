package lk.medilink.notification.messaging;

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

	public DoctorEventHandlers(NotificationStore store) {
		this.store = store;
	}

	public record DoctorVerified(Long doctorId, Long userId, String specialization, Instant verifiedAt) {
	}

	public record DoctorRejected(Long doctorId, Long userId, String reason, Instant rejectedAt) {
	}

	@RabbitListener(queues = "notification.doctor.verified")
	public void onVerified(DoctorVerified e) {
		log.info("[NOTIFY] Doctor verified: {}", e);
		store.add("doctor.verified", "Your doctor profile was verified (" + e.specialization() + ")", e.userId());
	}

	@RabbitListener(queues = "notification.doctor.rejected")
	public void onRejected(DoctorRejected e) {
		log.info("[NOTIFY] Doctor rejected: {}", e);
		store.add("doctor.rejected", "Your doctor profile was rejected: " + (e.reason() == null ? "Not specified" : e.reason()), e.userId());
	}
}

