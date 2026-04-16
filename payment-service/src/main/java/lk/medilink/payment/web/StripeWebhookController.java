package lk.medilink.payment.web;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import lk.medilink.payment.service.PaymentAppService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/payments/callback/stripe")
public class StripeWebhookController {
	private final PaymentAppService service;
	private final String webhookSecret;

	public StripeWebhookController(PaymentAppService service,
	                              @Value("${stripe.webhook-secret:}") String webhookSecret) {
		this.service = service;
		this.webhookSecret = webhookSecret;
	}

	@PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
	public ResponseEntity<String> handle(@RequestBody String payload,
	                                     @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader) {
		if (webhookSecret == null || webhookSecret.isBlank()) {
			return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("Stripe webhook is not configured");
		}
		if (sigHeader == null || sigHeader.isBlank()) {
			return ResponseEntity.badRequest().body("Missing Stripe-Signature header");
		}

		final Event event;
		try {
			event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
		} catch (SignatureVerificationException ex) {
			return ResponseEntity.badRequest().body("Invalid Stripe signature");
		}

		if (!"checkout.session.completed".equals(event.getType())) {
			return ResponseEntity.ok("ignored");
		}

		EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
		StripeObject stripeObject = deserializer.getObject().orElse(null);
		if (!(stripeObject instanceof Session session)) {
			return ResponseEntity.badRequest().body("Unexpected event payload");
		}

		String orderId = session.getClientReferenceId();
		if (orderId == null || orderId.isBlank()) {
			return ResponseEntity.badRequest().body("Missing client_reference_id");
		}

		String providerRef = session.getPaymentIntent();
		if (providerRef == null || providerRef.isBlank()) {
			providerRef = session.getId();
		}

		Instant paidAt = Instant.ofEpochSecond(event.getCreated());
		service.markCompleted(orderId, providerRef, paidAt);

		return ResponseEntity.ok("ok");
	}
}
