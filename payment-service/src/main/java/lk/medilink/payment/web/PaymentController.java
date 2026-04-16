package lk.medilink.payment.web;

import jakarta.validation.Valid;
import lk.medilink.payment.service.PaymentAppService;
import lk.medilink.payment.web.dto.CreateIntentRequest;
import lk.medilink.payment.web.dto.PaymentIntentResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
	private final PaymentAppService service;

	public PaymentController(PaymentAppService service) {
		this.service = service;
	}

	@PostMapping("/intents/payhere")
	@ResponseStatus(HttpStatus.CREATED)
	public PaymentIntentResponse createPayHereIntent(@RequestHeader("X-User-Id") Long patientId,
	                                                @RequestHeader(value = "X-User-Email", required = false) String patientEmail,
	                                                @Valid @RequestBody CreateIntentRequest req) {
		return service.createPayHereIntent(patientId, patientEmail, req.appointmentId(), req.amount(), req.resolvedCurrency());
	}

	@PostMapping("/intents/stripe")
	@ResponseStatus(HttpStatus.CREATED)
	public PaymentIntentResponse createStripeIntent(@RequestHeader("X-User-Id") Long patientId,
	                                               @RequestHeader(value = "X-User-Email", required = false) String patientEmail,
	                                               @Valid @RequestBody CreateIntentRequest req) {
		return service.createStripeCheckoutIntent(patientId, patientEmail, req.appointmentId(), req.amount(), req.resolvedCurrency());
	}

	@PostMapping("/stripe/confirm")
	public String confirmStripeCheckout(@RequestHeader("X-User-Id") Long patientId,
	                                   @RequestParam("sessionId") String sessionId) {
		service.confirmStripeCheckoutSession(patientId, sessionId);
		return "ok";
	}

	@GetMapping("/ping")
	public String ping() {
		return "payment-service @ " + Instant.now();
	}
}
