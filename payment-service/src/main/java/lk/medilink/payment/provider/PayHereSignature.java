package lk.medilink.payment.provider;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public final class PayHereSignature {
	private PayHereSignature() {
	}

	/**
	 * PayHere notify signature algorithm (md5sig).
	 *
	 * Uses the canonical pattern from PayHere docs:
	 * MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + MD5(merchant_secret).toUpperCase()).toUpperCase()
	 */
	public static String buildNotifyMd5Sig(String merchantId,
	                                      String orderId,
	                                      String payhereAmount,
	                                      String payhereCurrency,
	                                      String statusCode,
	                                      String merchantSecret) {
		String secretHash = md5Upper(merchantSecret);
		return md5Upper(merchantId + orderId + payhereAmount + payhereCurrency + statusCode + secretHash);
	}

	/**
	 * PayHere checkout form hash used when redirecting to the hosted checkout.
	 */
	public static String buildCheckoutHash(String merchantId,
	                                      String orderId,
	                                      String amount,
	                                      String currency,
	                                      String merchantSecret) {
		String secretHash = md5Upper(merchantSecret);
		return md5Upper(merchantId + orderId + amount + currency + secretHash);
	}

	private static String md5Upper(String input) {
		try {
			MessageDigest md = MessageDigest.getInstance("MD5");
			byte[] digest = md.digest((input == null ? "" : input).getBytes(StandardCharsets.UTF_8));
			StringBuilder sb = new StringBuilder(digest.length * 2);
			for (byte b : digest) {
				sb.append(String.format("%02x", b));
			}
			return sb.toString().toUpperCase();
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("MD5 not available", e);
		}
	}
}
