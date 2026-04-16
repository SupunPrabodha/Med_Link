package lk.medilink.payment.web;

import lk.medilink.payment.provider.PayHereConfig;
import lk.medilink.payment.provider.PayHereSignature;
import lk.medilink.payment.service.PaymentAppService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
	private static final Logger log = LoggerFactory.getLogger(PayHereNotifyController.class);

	private final PaymentAppService service;
	private final PayHereConfig cfg;

	public PayHereNotifyController(PaymentAppService service, PayHereConfig cfg) {
		this.service = service;
		this.cfg = cfg;
	}

	@PostMapping
	public String notify(@RequestParam MultiValueMap<String, String> params) {
		String merchantId = params.getFirst("merchant_id");
		String orderId = params.getFirst("order_id");
		String payhereAmount = params.getFirst("payhere_amount");
		String payhereCurrency = params.getFirst("payhere_currency");
		String statusCode = params.getFirst("status_code");
		String md5sig = params.getFirst("md5sig");
		String paymentId = params.getFirst("payment_id");

		try {
			merchantId = require(params, "merchant_id");
			orderId = require(params, "order_id");
			payhereAmount = require(params, "payhere_amount");
			payhereCurrency = require(params, "payhere_currency");
			statusCode = require(params, "status_code");
			md5sig = require(params, "md5sig");

			if (!cfg.merchantId().equals(merchantId)) {
				log.warn("PayHere notify rejected: merchant_id mismatch (got={}, expected={}) orderId={}", merchantId, cfg.merchantId(), orderId);
				throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid merchant_id");
			}

			String expected = PayHereSignature.buildNotifyMd5Sig(merchantId, orderId, payhereAmount, payhereCurrency, statusCode, cfg.merchantSecret());
			if (!expected.equalsIgnoreCase(md5sig)) {
				log.warn("PayHere notify rejected: invalid signature orderId={} statusCode={} amount={} currency={}", orderId, statusCode, payhereAmount, payhereCurrency);
				throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid signature");
			}

			log.info("PayHere notify accepted: orderId={} statusCode={} paymentId={}", orderId, statusCode, paymentId);

			// PayHere status_code: 2 = success
			if ("2".equals(statusCode)) {
				service.markCompleted(orderId, paymentId, Instant.now());
				return "OK";
			}

			service.markFailed(orderId, paymentId, Instant.now());
			return "FAILED";
		} catch (ResponseStatusException ex) {
			if (orderId == null || orderId.isBlank()) {
				log.warn("PayHere notify failed: {} (missing/invalid fields)", ex.getReason());
			} else {
				log.warn("PayHere notify failed: orderId={} reason={}", orderId, ex.getReason());
			}
			throw ex;
		} catch (RuntimeException ex) {
			log.error("PayHere notify error: orderId={}", orderId, ex);
			throw ex;
		}
	}

	private static String require(MultiValueMap<String, String> p, String k) {
		String v = p.getFirst(k);
		if (v == null || v.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing: " + k);
		return v;
	}
}

