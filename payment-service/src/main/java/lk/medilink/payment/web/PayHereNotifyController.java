package lk.medilink.payment.web;

import lk.medilink.payment.provider.PayHereConfig;
import lk.medilink.payment.provider.PayHereSignature;
import lk.medilink.payment.service.PaymentAppService;
import org.springframework.http.HttpStatus;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

/**
 * PayHere server-to-server notify endpoint.
 *
 * PayHere sends a form POST with parameters including md5sig.
 * This implementation verifies the signature and marks the payment completed/failed.
 */
@RestController
@RequestMapping("/api/payments/callback/payhere")
public class PayHereNotifyController {
	private final PaymentAppService service;
	private final PayHereConfig cfg;

	public PayHereNotifyController(PaymentAppService service, PayHereConfig cfg) {
		this.service = service;
		this.cfg = cfg;
	}

	@PostMapping
	public String notify(@RequestParam MultiValueMap<String, String> params) {
		String merchantId = first(params, "merchant_id");
		String orderId = first(params, "order_id");
		String payhereAmount = first(params, "payhere_amount");
		String payhereCurrency = first(params, "payhere_currency");
		String statusCode = first(params, "status_code");
		String md5sig = first(params, "md5sig");
		String paymentId = params.getFirst("payment_id");

		if (!cfg.merchantId().equals(merchantId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid merchant_id");
		}

		String expected = PayHereSignature.buildNotifyMd5Sig(merchantId, orderId, payhereAmount, payhereCurrency, statusCode, cfg.merchantSecret());
		if (!expected.equalsIgnoreCase(md5sig)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid signature");
		}

		// PayHere status_code: 2 = success
		if ("2".equals(statusCode)) {
			service.markCompleted(orderId, paymentId, Instant.now());
			return "OK";
		}

		service.markFailed(orderId, paymentId, Instant.now());
		return "FAILED";
	}

	private static String first(MultiValueMap<String, String> p, String k) {
		String v = p.getFirst(k);
		if (v == null || v.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing: " + k);
		return v;
	}
}

