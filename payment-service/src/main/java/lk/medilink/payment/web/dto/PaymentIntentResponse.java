package lk.medilink.payment.web.dto;

import java.util.Map;

public record PaymentIntentResponse(
		String checkoutUrl,
		Map<String, String> formFields
) {
}
