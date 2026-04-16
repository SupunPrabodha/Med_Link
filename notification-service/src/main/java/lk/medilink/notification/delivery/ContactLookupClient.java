package lk.medilink.notification.delivery;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.Duration;

@Component
public class ContactLookupClient {
	private final RestTemplate rest;
	private final String internalToken;
	private final String authBaseUrl;
	private final String patientBaseUrl;
	private final String doctorBaseUrl;

	public ContactLookupClient(RestTemplateBuilder restTemplateBuilder,
	                          @Value("${app.internal-token:}") String internalToken,
	                          @Value("${app.auth-base-url:http://localhost:8081}") String authBaseUrl,
	                          @Value("${app.patient-base-url:http://localhost:8086}") String patientBaseUrl,
	                          @Value("${app.doctor-base-url:http://localhost:8084}") String doctorBaseUrl) {
		this.rest = restTemplateBuilder
				.setConnectTimeout(Duration.ofSeconds(2))
				.setReadTimeout(Duration.ofSeconds(5))
				.build();
		this.internalToken = internalToken == null ? "" : internalToken;
		this.authBaseUrl = authBaseUrl;
		this.patientBaseUrl = patientBaseUrl;
		this.doctorBaseUrl = doctorBaseUrl;
	}

	public String emailForUser(Long userId) {
		InternalUserContact u = get(
				UriComponentsBuilder.fromHttpUrl(authBaseUrl)
						.path("/internal/users/{userId}")
						.buildAndExpand(userId)
						.toUriString(),
				InternalUserContact.class
		);
		return u == null ? null : u.email();
	}

	public String phoneForPatientUser(Long userId) {
		InternalPatientContact p = get(
				UriComponentsBuilder.fromHttpUrl(patientBaseUrl)
						.path("/internal/patients/{userId}/contact")
						.buildAndExpand(userId)
						.toUriString(),
				InternalPatientContact.class
		);
		return p == null ? null : p.phone();
	}

	public InternalDoctorContact doctorContactByDoctorId(Long doctorId) {
		return get(
				UriComponentsBuilder.fromHttpUrl(doctorBaseUrl)
						.path("/internal/doctors/{doctorId}/contact")
						.buildAndExpand(doctorId)
						.toUriString(),
				InternalDoctorContact.class
		);
	}

	public InternalDoctorContact doctorContactByUserId(Long userId) {
		return get(
				UriComponentsBuilder.fromHttpUrl(doctorBaseUrl)
						.path("/internal/doctors/by-user/{userId}/contact")
						.buildAndExpand(userId)
						.toUriString(),
				InternalDoctorContact.class
		);
	}

	private <T> T get(String url, Class<T> clazz) {
		if (internalToken.isBlank()) {
			return null;
		}
		HttpHeaders headers = new HttpHeaders();
		headers.set("X-Internal-Token", internalToken);
		HttpEntity<Void> entity = new HttpEntity<>(headers);
		try {
			ResponseEntity<T> res = rest.exchange(url, HttpMethod.GET, entity, clazz);
			return res.getBody();
		} catch (RestClientException ex) {
			return null;
		}
	}

	public record InternalUserContact(Long userId, String email, String role) {
	}

	public record InternalPatientContact(Long userId, String fullName, String phone, String profilePhotoUrl) {
	}

	public record InternalDoctorContact(Long doctorId, Long userId, String fullName, String phone, String profilePhotoUrl) {
	}
}
