package lk.medilink.payment.service;

import lk.medilink.payment.domain.Payment;
import lk.medilink.payment.domain.PaymentStatus;
import lk.medilink.payment.messaging.PaymentEvents;
import lk.medilink.payment.messaging.RabbitConfig;
import lk.medilink.payment.provider.PayHereConfig;
import lk.medilink.payment.provider.PayHereSignature;
import lk.medilink.payment.repo.PaymentRepository;
import lk.medilink.payment.web.dto.PaymentIntentResponse;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PaymentAppService {
	private final PaymentRepository repo;
	private final RabbitTemplate rabbit;
	private final PayHereConfig payhere;
	private final String gatewayBaseUrl;

	public PaymentAppService(PaymentRepository repo,
	                        RabbitTemplate rabbit,
	                        PayHereConfig payhere,
	                        @Value("${app.gateway-base-url:http://localhost:8090}") String gatewayBaseUrl) {
		this.repo = repo;
		this.rabbit = rabbit;
		this.payhere = payhere;
		this.gatewayBaseUrl = gatewayBaseUrl;
	}

	@Transactional
	public PaymentIntentResponse createPayHereIntent(Long patientId, Long appointmentId, BigDecimal amount, String currency) {
		if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid amount");
		}
		String orderId = "ML-" + UUID.randomUUID();
		Payment p = repo.save(new Payment(orderId, appointmentId, patientId, amount, currency));

		String amountStr = amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
		String hash = PayHereSignature.buildCheckoutHash(payhere.merchantId(), orderId, amountStr, currency, payhere.merchantSecret());

		String notifyUrl = gatewayBaseUrl + "/api/payments/callback/payhere";
		String returnUrl = gatewayBaseUrl + "/swagger";
		String cancelUrl = gatewayBaseUrl + "/swagger";

		Map<String, String> fields = new LinkedHashMap<>();
		fields.put("merchant_id", payhere.merchantId());
		fields.put("return_url", returnUrl);
		fields.put("cancel_url", cancelUrl);
		fields.put("notify_url", notifyUrl);
		fields.put("order_id", orderId);
		fields.put("items", "MediLink appointment");
		fields.put("currency", currency);
		fields.put("amount", amountStr);
		fields.put("custom_1", String.valueOf(appointmentId));
		fields.put("hash", hash);

		return new PaymentIntentResponse(payhere.checkoutUrl(), fields);
	}

	@Transactional
	public void markCompleted(String orderId, String providerRef, Instant paidAt) {
		Payment p = repo.findByOrderId(orderId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
		if (p.getStatus() == PaymentStatus.COMPLETED) {
			return;
		}
		p.markCompleted(providerRef, paidAt);
		repo.save(p);

		rabbit.convertAndSend(RabbitConfig.EXCHANGE, "payment.completed",
				new PaymentEvents.PaymentCompleted(p.getId(), p.getAppointmentId(), p.getAmount(), p.getOrderId(), p.getProviderRef(), paidAt));
	}

	@Transactional
	public void markFailed(String orderId, String providerRef, Instant failedAt) {
		Payment p = repo.findByOrderId(orderId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
		if (p.getStatus() == PaymentStatus.FAILED) {
			return;
		}
		p.markFailed(providerRef, failedAt);
		repo.save(p);

		rabbit.convertAndSend(RabbitConfig.EXCHANGE, "payment.failed",
				new PaymentEvents.PaymentFailed(p.getId(), p.getAppointmentId(), p.getAmount(), p.getOrderId(), p.getProviderRef(), failedAt));
	}
}
