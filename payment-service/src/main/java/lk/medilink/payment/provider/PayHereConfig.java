package lk.medilink.payment.provider;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "payhere")
public record PayHereConfig(
		boolean sandbox,
		String merchantId,
		String merchantSecret,
		String sandboxCheckoutUrl,
		String liveCheckoutUrl
) {
	public String checkoutUrl() {
		String sandboxUrl = (sandboxCheckoutUrl == null || sandboxCheckoutUrl.isBlank())
				? "https://sandbox.payhere.lk/pay/checkout"
				: sandboxCheckoutUrl;
		String liveUrl = (liveCheckoutUrl == null || liveCheckoutUrl.isBlank())
				? "https://www.payhere.lk/pay/checkout"
				: liveCheckoutUrl;
		return sandbox ? sandboxUrl : liveUrl;
	}
}
