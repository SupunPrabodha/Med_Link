package lk.medilink.telemedicine.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lk.medilink.telemedicine.domain.SessionStatus;
import lk.medilink.telemedicine.domain.TelemedicineSession;
import lk.medilink.telemedicine.messaging.ConsultationEvents;
import lk.medilink.telemedicine.messaging.RabbitConfig;
import lk.medilink.telemedicine.repo.TelemedicineSessionRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@Service
public class TelemedicineAppService {
	@JsonIgnoreProperties(ignoreUnknown = true)
	public record DoctorProfileResponse(Long id) {
	}

	private final TelemedicineSessionRepository repo;
	private final RabbitTemplate rabbit;
	private final RestTemplate rest;
	private final String jitsiBaseUrl;
	private final String doctorBaseUrl;

	public TelemedicineAppService(TelemedicineSessionRepository repo,
	                             RabbitTemplate rabbit,
	                             RestTemplateBuilder restBuilder,
	                             @Value("${app.jitsi-base-url:https://meet.jit.si}") String jitsiBaseUrl,
	                             @Value("${app.doctor-base-url:http://localhost:8084}") String doctorBaseUrl) {
		this.repo = repo;
		this.rabbit = rabbit;
		this.rest = restBuilder.build();
		this.jitsiBaseUrl = jitsiBaseUrl;
		this.doctorBaseUrl = doctorBaseUrl;
	}

	@Transactional
	public TelemedicineSession upsertFromConfirmedAppointment(Long appointmentId, Long patientUserId, Long doctorId, Instant slotTime) {
		String roomName = "medilink-appt-" + appointmentId;
		String joinUrl = buildJoinUrl(roomName);

		return repo.findByAppointmentId(appointmentId)
				.map(existing -> {
					existing.reactivate(patientUserId, doctorId, slotTime, roomName, joinUrl);
					return existing;
				})
				.orElseGet(() -> repo.save(new TelemedicineSession(appointmentId, patientUserId, doctorId, slotTime, roomName, joinUrl)));
	}

	@Transactional
	public void cancelByAppointmentId(Long appointmentId) {
		repo.findByAppointmentId(appointmentId).ifPresent(TelemedicineSession::cancel);
	}

	@Transactional
	public TelemedicineSession completeConsultation(Long appointmentId, Long requesterUserId, String roles) {
		boolean isDoctor = roles != null && roles.contains("DOCTOR");
		if (!isDoctor) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
		}

		TelemedicineSession s = repo.findByAppointmentId(appointmentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Telemedicine session not found"));

		Long doctorId = resolveDoctorIdForUser(requesterUserId);
		if (!doctorId.equals(s.getDoctorId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
		}
		if (s.getStatus() != SessionStatus.ACTIVE) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Session is not active");
		}

		boolean changed = s.complete();
		TelemedicineSession saved = repo.save(s);
		if (changed) {
			rabbit.convertAndSend(
					RabbitConfig.EXCHANGE,
					"consultation.completed",
					new ConsultationEvents.ConsultationCompleted(
							saved.getAppointmentId(),
							saved.getPatientUserId(),
							saved.getDoctorId(),
							saved.getSlotTime(),
							saved.getCompletedAt()
					)
			);
		}
		return saved;
	}

	public TelemedicineSession getSessionForAppointment(Long appointmentId, Long requesterUserId, String roles) {
		TelemedicineSession s = repo.findByAppointmentId(appointmentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Telemedicine session not found"));

		boolean isAdmin = roles != null && roles.contains("ADMIN");
		boolean isDoctor = roles != null && roles.contains("DOCTOR");
		boolean isPatient = roles != null && roles.contains("PATIENT");

		if (isAdmin) {
			return s;
		}
		if (isPatient) {
			if (!requesterUserId.equals(s.getPatientUserId())) {
				throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
			}
			return s;
		}
		if (isDoctor) {
			Long doctorId = resolveDoctorIdForUser(requesterUserId);
			if (!doctorId.equals(s.getDoctorId())) {
				throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
			}
			return s;
		}

		throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
	}

	private String buildJoinUrl(String roomName) {
		String base = jitsiBaseUrl == null ? "" : jitsiBaseUrl.trim();
		if (base.endsWith("/")) {
			base = base.substring(0, base.length() - 1);
		}
		return base + "/" + roomName;
	}

	private Long resolveDoctorIdForUser(Long doctorUserId) {
		try {
			String uri = doctorBaseUrl + "/api/doctors/me/profile";

			HttpHeaders headers = new HttpHeaders();
			headers.set("X-User-Id", String.valueOf(doctorUserId));

			ResponseEntity<DoctorProfileResponse> resp = rest.exchange(
					uri,
					HttpMethod.GET,
					new HttpEntity<>(headers),
					DoctorProfileResponse.class
			);

			DoctorProfileResponse body = resp.getBody();
			if (body == null || body.id() == null) {
				throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor profile not found");
			}
			return body.id();
		} catch (ResponseStatusException ex) {
			throw ex;
		} catch (RestClientException ex) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Doctor service unavailable");
		}
	}
}
