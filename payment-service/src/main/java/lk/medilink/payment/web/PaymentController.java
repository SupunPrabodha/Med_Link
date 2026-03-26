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
	                                                @Valid @RequestBody CreateIntentRequest req) {
		return service.createPayHereIntent(patientId, req.appointmentId(), req.amount(), req.resolvedCurrency());
	}

	@GetMapping("/ping")
	public String ping() {
		return "payment-service @ " + Instant.now();
	}
}
