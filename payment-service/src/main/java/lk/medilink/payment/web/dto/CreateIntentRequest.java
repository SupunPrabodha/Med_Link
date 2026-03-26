package lk.medilink.payment.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateIntentRequest(
		@NotNull Long appointmentId,
		@NotNull @DecimalMin("0.01") BigDecimal amount,
		String currency
) {
	public String resolvedCurrency() {
		return (currency == null || currency.isBlank()) ? "LKR" : currency;
	}
}
