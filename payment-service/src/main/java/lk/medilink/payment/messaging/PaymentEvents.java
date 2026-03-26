package lk.medilink.payment.messaging;

import java.math.BigDecimal;
import java.time.Instant;

public final class PaymentEvents {
	private PaymentEvents() {
	}

	public record PaymentCompleted(Long paymentId,
	                              Long appointmentId,
	                              BigDecimal amount,
	                              String orderId,
	                              String providerRef,
	                              Instant paidAt) {
	}

	public record PaymentFailed(Long paymentId,
	                           Long appointmentId,
	                           BigDecimal amount,
	                           String orderId,
	                           String providerRef,
	                           Instant failedAt) {
	}
}
