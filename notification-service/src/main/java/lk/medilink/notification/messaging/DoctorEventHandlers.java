package lk.medilink.notification.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class DoctorEventHandlers {
	private static final Logger log = LoggerFactory.getLogger(DoctorEventHandlers.class);

	public record DoctorVerified(Long doctorId, Long userId, String specialization, Instant verifiedAt) {
	}

	public record DoctorRejected(Long doctorId, Long userId, String reason, Instant rejectedAt) {
	}

	@RabbitListener(queues = "notification.doctor.verified")
	public void onVerified(DoctorVerified e) {
		log.info("[NOTIFY] Doctor verified: {}", e);
	}

	@RabbitListener(queues = "notification.doctor.rejected")
	public void onRejected(DoctorRejected e) {
		log.info("[NOTIFY] Doctor rejected: {}", e);
	}
}

