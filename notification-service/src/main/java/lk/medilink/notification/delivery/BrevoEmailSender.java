package lk.medilink.notification.delivery;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Component
public class BrevoEmailSender {
	private static final Logger log = LoggerFactory.getLogger(BrevoEmailSender.class);

	private final RestTemplate rest;
	private final String apiKey;
	private final String fromEmail;
	private final String fromName;

	public BrevoEmailSender(RestTemplateBuilder restTemplateBuilder,
	                       @Value("${app.brevo.api-key:}") String apiKey,
	                       @Value("${app.brevo.from-email:}") String fromEmail,
	                       @Value("${app.brevo.from-name:MediLink LK}") String fromName) {
		this.rest = restTemplateBuilder
				.setConnectTimeout(Duration.ofSeconds(3))
				.setReadTimeout(Duration.ofSeconds(8))
				.build();
		this.apiKey = apiKey == null ? "" : apiKey;
		this.fromEmail = fromEmail == null ? "" : fromEmail;
		this.fromName = fromName == null ? "" : fromName;
	}

	public boolean isEnabled() {
		return !apiKey.isBlank() && !fromEmail.isBlank();
	}

	public void send(String toEmail, String subject, String textBody) {
		if (!isEnabled()) return;
		if (toEmail == null || toEmail.isBlank()) return;
		if (subject == null || subject.isBlank()) subject = "Notification";
		if (textBody == null) textBody = "";

		HttpHeaders h = new HttpHeaders();
		h.setContentType(MediaType.APPLICATION_JSON);
		h.set("api-key", apiKey);

		Map<String, Object> payload = Map.of(
				"sender", Map.of("email", fromEmail, "name", fromName),
				"to", List.of(Map.of("email", toEmail)),
				"subject", subject,
				"textContent", textBody
		);

		HttpEntity<Map<String, Object>> req = new HttpEntity<>(payload, h);
		try {
			ResponseEntity<String> res = rest.exchange(
					"https://api.brevo.com/v3/smtp/email",
					HttpMethod.POST,
					req,
					String.class
			);
			if (!res.getStatusCode().is2xxSuccessful()) {
				log.warn("Brevo email failed: status={}", res.getStatusCode().value());
			}
		} catch (RestClientException ex) {
			log.warn("Brevo email failed: {}", ex.getMessage());
		}
	}
}
