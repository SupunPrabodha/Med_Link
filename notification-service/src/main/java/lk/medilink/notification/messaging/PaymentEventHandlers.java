package lk.medilink.notification.messaging;

import lk.medilink.notification.store.NotificationStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;

@Component
public class PaymentEventHandlers {
	private static final Logger log = LoggerFactory.getLogger(PaymentEventHandlers.class);
	private final NotificationStore store;

	public PaymentEventHandlers(NotificationStore store) {
		this.store = store;
	}

	public record PaymentCompleted(Long paymentId, Long appointmentId, Long patientId, BigDecimal amount, String orderId, String providerRef, Instant paidAt) {
	}

	public record PaymentFailed(Long paymentId, Long appointmentId, Long patientId, BigDecimal amount, String orderId, String providerRef, Instant failedAt) {
	}

	@RabbitListener(queues = "notification.payment.completed")
	public void onCompleted(PaymentCompleted e) {
		log.info("[NOTIFY] Payment completed: {}", e);
		store.add("payment.completed", "Payment received for appointment #" + e.appointmentId() + " (order " + e.orderId() + ")", e.patientId());
	}

	@RabbitListener(queues = "notification.payment.failed")
	public void onFailed(PaymentFailed e) {
		log.info("[NOTIFY] Payment failed: {}", e);
		store.add("payment.failed", "Payment failed for appointment #" + e.appointmentId() + " (order " + e.orderId() + ")", e.patientId());
	}
}

