package lk.medilink.notification.delivery;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

@Component
public class TwilioSmsSender {
	private static final Logger log = LoggerFactory.getLogger(TwilioSmsSender.class);

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
	}

	public boolean isEnabled() {
		return !accountSid.isBlank() && !authToken.isBlank() && !fromNumber.isBlank();
	}

	public void send(String toNumber, String body) {
		if (!isEnabled()) return;
		if (toNumber == null || toNumber.isBlank()) return;
		if (body == null) body = "";

		String url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";

		HttpHeaders h = new HttpHeaders();
		h.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
		h.set(HttpHeaders.AUTHORIZATION, basicAuth(accountSid, authToken));

		MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
		form.add("From", fromNumber);
		form.add("To", toNumber);
		form.add("Body", body);

		HttpEntity<MultiValueMap<String, String>> req = new HttpEntity<>(form, h);
		try {
			ResponseEntity<String> res = rest.exchange(url, HttpMethod.POST, req, String.class);
			if (!res.getStatusCode().is2xxSuccessful()) {
				log.warn("Twilio SMS failed: status={}", res.getStatusCode().value());
			}
		} catch (RestClientException ex) {
			log.warn("Twilio SMS failed: {}", ex.getMessage());
		}
	}

	private static String basicAuth(String user, String pass) {
		String v = (user == null ? "" : user) + ":" + (pass == null ? "" : pass);
		String b64 = Base64.getEncoder().encodeToString(v.getBytes(StandardCharsets.UTF_8));
		return "Basic " + b64;
	}
}
