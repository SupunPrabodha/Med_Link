package lk.medilink.notification.delivery;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Map;
import java.util.regex.Pattern;

@Component
public class TwilioSmsSender {
	private static final Logger log = LoggerFactory.getLogger(TwilioSmsSender.class);
	private static final Pattern E164 = Pattern.compile("^\\+[1-9]\\d{7,14}$");

	private final RestTemplate rest;
	private final String accountSid;
	private final String authToken;
	private final String fromNumber;

	public TwilioSmsSender(RestTemplateBuilder restTemplateBuilder,
	                       @Value("${app.twilio.account-sid:}") String accountSid,
	                       @Value("${app.twilio.auth-token:}") String authToken,
	                       @Value("${app.twilio.from-number:}") String fromNumber) {
		this.rest = restTemplateBuilder
				.setConnectTimeout(Duration.ofSeconds(3))
				.setReadTimeout(Duration.ofSeconds(8))
				.build();
		this.accountSid = accountSid == null ? "" : accountSid;
		this.authToken = authToken == null ? "" : authToken;
		this.fromNumber = fromNumber == null ? "" : fromNumber;

		log.info(
				"Twilio SMS sender configured: enabled={} from={} sidLen={} tokenLen={}",
				isEnabled(),
				safePhone(this.fromNumber),
				this.accountSid.length(),
				this.authToken.length()
		);
	}

	public boolean isEnabled() {
		return !accountSid.isBlank() && !authToken.isBlank() && !fromNumber.isBlank();
	}

	public void send(String toNumber, String body) {
		if (!isEnabled()) return;
		if (toNumber == null || toNumber.isBlank()) return;
		if (body == null) body = "";

		String normalizedTo = normalizeToE164(toNumber);
		if (normalizedTo == null) {
			log.warn("Twilio SMS skipped: invalid 'To' number: {}", safePhone(toNumber));
			return;
		}

		String url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";

		HttpHeaders h = new HttpHeaders();
		h.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
		h.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));
		h.set(HttpHeaders.AUTHORIZATION, basicAuth(accountSid, authToken));

		MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
		form.add("From", fromNumber);
		form.add("To", normalizedTo);
		form.add("Body", body);

		HttpEntity<MultiValueMap<String, String>> req = new HttpEntity<>(form, h);
		try {
			ResponseEntity<Map<String, Object>> res = rest.exchange(url, HttpMethod.POST, req, new ParameterizedTypeReference<>() {});
			if (res.getStatusCode().is2xxSuccessful()) {
				Object sid = res.getBody() == null ? null : res.getBody().get("sid");
				log.info("Twilio SMS accepted: to={} sid={}", safePhone(normalizedTo), sid == null ? "<none>" : String.valueOf(sid));
				return;
			}
			log.warn("Twilio SMS failed: status={} body={}", res.getStatusCode().value(), res.getBody());
		} catch (HttpStatusCodeException ex) {
			String bodyText = ex.getResponseBodyAsString();
			log.warn("Twilio SMS failed: status={} body={}", ex.getStatusCode().value(), bodyText == null || bodyText.isBlank() ? "<empty>" : bodyText);
		} catch (RestClientException ex) {
			log.warn("Twilio SMS failed: {}", ex.getMessage());
		}
	}

	private static String normalizeToE164(String raw) {
		if (raw == null) return null;
		String s = raw.trim();
		if (s.isEmpty()) return null;
		s = s.replaceAll("[\\s\\-()]+", "");
		if (s.startsWith("00")) {
			s = "+" + s.substring(2);
		} else if (!s.startsWith("+")) {
			// Sri Lanka local format support: 0XXXXXXXXX -> +94XXXXXXXXX
			if (s.matches("^0\\d{9}$")) {
				s = "+94" + s.substring(1);
			} else if (s.matches("^94\\d{9}$")) {
				s = "+" + s;
			}
		}
		if (!E164.matcher(s).matches()) return null;
		return s;
	}

	private static String safePhone(String phone) {
		if (phone == null || phone.isBlank()) return "<empty>";
		String s = phone.replaceAll("\\s+", "").trim();
		if (s.length() <= 4) return "***";
		return s.substring(0, Math.min(4, s.length())) + "***";
	}

	private static String basicAuth(String user, String pass) {
		String v = (user == null ? "" : user) + ":" + (pass == null ? "" : pass);
		String b64 = Base64.getEncoder().encodeToString(v.getBytes(StandardCharsets.UTF_8));
		return "Basic " + b64;
	}
}
