package lk.medilink.payment.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class PaymentAppService {
	@JsonIgnoreProperties(ignoreUnknown = true)
	public record AppointmentRow(Long id, String status, String appoinmentApproval) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record PatientProfileRow(String fullName, String phone, String address) {
	}

	private final PaymentRepository repo;
	private final RabbitTemplate rabbit;
	private final RestTemplate rest;
	private final PayHereConfig payhere;
	private final String appointmentBaseUrl;
	private final String patientBaseUrl;
	private final String gatewayBaseUrl;

	public PaymentAppService(PaymentRepository repo,
	                        RabbitTemplate rabbit,
	                        RestTemplateBuilder restBuilder,
	                        PayHereConfig payhere,
	                        @Value("${app.appointment-base-url:http://localhost:8082}") String appointmentBaseUrl,
	                        @Value("${app.patient-base-url:http://localhost:8086}") String patientBaseUrl,
	                        @Value("${app.gateway-base-url:http://localhost:8090}") String gatewayBaseUrl) {
		this.repo = repo;
		this.rabbit = rabbit;
		this.rest = restBuilder.build();
		this.payhere = payhere;
		this.appointmentBaseUrl = appointmentBaseUrl;
		this.patientBaseUrl = patientBaseUrl;
		this.gatewayBaseUrl = gatewayBaseUrl;
	}

	@Transactional
	public PaymentIntentResponse createPayHereIntent(Long patientId,
	                                               String patientEmail,
	                                               Long appointmentId,
	                                               BigDecimal amount,
	                                               String currency) {
		if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid amount");
		}
		if (patientEmail == null || patientEmail.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing patient email");
		}

		String merchantId = payhere.merchantId();
		String merchantSecret = payhere.merchantSecret();
		if (merchantId == null || merchantId.isBlank()
				|| merchantSecret == null || merchantSecret.isBlank()
				|| "change-me".equalsIgnoreCase(merchantId)
				|| "change-me".equalsIgnoreCase(merchantSecret)) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "PayHere merchant credentials are not configured");
		}

		AppointmentRow appt;
		try {
			HttpHeaders headers = new HttpHeaders();
			headers.set("X-User-Id", String.valueOf(patientId));
			ResponseEntity<AppointmentRow[]> resp = rest.exchange(
					appointmentBaseUrl + "/api/appointments",
					HttpMethod.GET,
					new HttpEntity<>(headers),
					AppointmentRow[].class
			);
			AppointmentRow[] body = resp.getBody();
			appt = body == null
					? null
					: Arrays.stream(body).filter(a -> appointmentId.equals(a.id())).findFirst().orElse(null);
		} catch (RestClientException ex) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Appointment service unavailable");
		}

		if (appt == null) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found");
		}
		if (!"PENDING_PAYMENT".equals(appt.status())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Appointment is not payable");
		}
		if (!"APPROVED".equals(appt.appoinmentApproval())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor approval required");
		}

		PatientProfileRow profile;
		try {
			HttpHeaders headers = new HttpHeaders();
			headers.set("X-User-Id", String.valueOf(patientId));
			ResponseEntity<PatientProfileRow> resp = rest.exchange(
					patientBaseUrl + "/api/patients/me/profile",
					HttpMethod.GET,
					new HttpEntity<>(headers),
					PatientProfileRow.class
			);
			profile = resp.getBody();
		} catch (org.springframework.web.client.HttpClientErrorException.NotFound ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Patient profile required");
		} catch (RestClientException ex) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Patient service unavailable");
		}

		if (profile == null || profile.fullName() == null || profile.fullName().isBlank() || profile.phone() == null || profile.phone().isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Patient profile required");
		}

		String fullName = profile.fullName().trim();
		String[] nameParts = fullName.split("\\s+", 2);
		String firstName = nameParts[0];
		String lastName = nameParts.length > 1 ? nameParts[1] : "-";

		String phone = profile.phone().trim();
		String address = (profile.address() == null || profile.address().isBlank()) ? "N/A" : profile.address().trim();

		String orderId = "ML-" + UUID.randomUUID();
		Payment p = repo.save(new Payment(orderId, appointmentId, patientId, amount, currency));

		String amountStr = amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
		String hash = PayHereSignature.buildCheckoutHash(merchantId, orderId, amountStr, currency, merchantSecret);

		String notifyUrl = gatewayBaseUrl + "/api/payments/callback/payhere";
		String returnUrl = gatewayBaseUrl + "/swagger";
		String cancelUrl = gatewayBaseUrl + "/swagger";

		Map<String, String> fields = new LinkedHashMap<>();
		fields.put("merchant_id", merchantId);
		fields.put("return_url", returnUrl);
		fields.put("cancel_url", cancelUrl);
		fields.put("notify_url", notifyUrl);
		fields.put("order_id", orderId);
		fields.put("items", "MediLink appointment");
		fields.put("currency", currency);
		fields.put("amount", amountStr);
		fields.put("custom_1", String.valueOf(appointmentId));
		fields.put("custom_2", String.valueOf(patientId));

		fields.put("first_name", firstName);
		fields.put("last_name", lastName);
		fields.put("email", patientEmail.trim());
		fields.put("phone", phone);
		fields.put("address", address);
		fields.put("city", "Colombo");
		fields.put("country", "Sri Lanka");
		fields.put("delivery_address", address);
		fields.put("delivery_city", "Colombo");
		fields.put("delivery_country", "Sri Lanka");

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
