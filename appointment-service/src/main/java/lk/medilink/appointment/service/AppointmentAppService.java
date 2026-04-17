package lk.medilink.appointment.service;

import lk.medilink.appointment.domain.Appointment;
import lk.medilink.appointment.domain.AppointmentApproval;
import lk.medilink.appointment.domain.AppointmentStatus;
import lk.medilink.appointment.messaging.AppointmentEvents;
import lk.medilink.appointment.messaging.RabbitConfig;
import lk.medilink.appointment.repo.AppointmentRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.web.client.HttpStatusCodeException;

@Service
public class AppointmentAppService {
	private static final int MAX_DAYS = 30;
	private final AppointmentRepository repo;
	private final RabbitTemplate rabbit;
	private final RestTemplate rest;
	private final String doctorBaseUrl;
	private final String patientBaseUrl;

	public AppointmentAppService(AppointmentRepository repo,
	                            RabbitTemplate rabbit,
	                            RestTemplateBuilder restTemplateBuilder,
	                            @Value("${app.doctor-base-url:http://localhost:8084}") String doctorBaseUrl,
	                            @Value("${app.patient-base-url:http://localhost:8086}") String patientBaseUrl) {
		this.repo = repo;
		this.rabbit = rabbit;
		this.rest = restTemplateBuilder
				.setConnectTimeout(Duration.ofSeconds(2))
				.setReadTimeout(Duration.ofSeconds(5))
				.build();
		this.doctorBaseUrl = doctorBaseUrl;
		this.patientBaseUrl = patientBaseUrl;
	}

	@Transactional
	public Appointment create(Long patientId, Long doctorId, Instant slotTime) {
		if (doctorId == null || doctorId <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid doctorId");
		}
		if (slotTime == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "slotTime is required");
		}
		if (!slotTime.isAfter(Instant.now().plus(Duration.ofMinutes(1)))) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Slot time must be in the future");
		}

		if (!doctorAllowsSlot(doctorId, slotTime)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor is not available at that time");
		}
		if (repo.existsByDoctorIdAndSlotTimeAndStatusNot(doctorId, slotTime, AppointmentStatus.CANCELLED)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "That slot is already booked");
		}

		Appointment saved = repo.save(new Appointment(patientId, doctorId, slotTime, AppointmentStatus.PENDING_PAYMENT));
		rabbit.convertAndSend(RabbitConfig.EXCHANGE, "appointment.created",
				new AppointmentEvents.AppointmentCreated(saved.getId(), patientId, doctorId, slotTime));
		return saved;
	}

	@Transactional
	public Appointment reschedule(Long appointmentId, Long requesterUserId, boolean isAdmin, Instant newSlotTime) {
		if (newSlotTime == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "slotTime is required");
		}
		if (!newSlotTime.isAfter(Instant.now().plus(Duration.ofMinutes(1)))) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Slot time must be in the future");
		}

		Appointment appt = repo.findById(appointmentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));

		if (!isAdmin && !appt.getPatientId().equals(requesterUserId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
		}
		if (appt.getStatus() == AppointmentStatus.CANCELLED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot reschedule a cancelled appointment");
		}
		if (appt.getStatus() == AppointmentStatus.CONFIRMED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot reschedule a confirmed appointment; cancel it instead");
		}

		Long doctorId = appt.getDoctorId();
		if (!doctorAllowsSlot(doctorId, newSlotTime)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Doctor is not available at that time");
		}
		if (repo.existsByDoctorIdAndSlotTimeAndStatusNotAndIdNot(doctorId, newSlotTime, AppointmentStatus.CANCELLED, appt.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "That slot is already booked");
		}

		Instant oldSlotTime = appt.getSlotTime();
		appt.setSlotTime(newSlotTime);
		appt.setAppoinmentApproval(null);

		rabbit.convertAndSend(RabbitConfig.EXCHANGE, "appointment.rescheduled",
				new AppointmentEvents.AppointmentRescheduled(appt.getId(), appt.getPatientId(), appt.getDoctorId(), oldSlotTime, newSlotTime, Instant.now()));
		return appt;
	}

	public List<Instant> availableSlots(Long doctorId, int days) {
		if (doctorId == null || doctorId <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid doctorId");
		}
		if (days < 1 || days > MAX_DAYS) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "days must be between 1 and " + MAX_DAYS);
		}

		Instant from = Instant.now().plus(Duration.ofMinutes(1));
		Instant to = from.plus(Duration.ofDays(days));

		List<Instant> candidate = fetchDoctorSlots(doctorId, days);
		if (candidate.isEmpty()) {
			return List.of();
		}

		Set<Instant> taken = repo.findByDoctorIdAndSlotTimeBetween(doctorId, from, to).stream()
				.filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
				.map(Appointment::getSlotTime)
				.collect(Collectors.toSet());

		return candidate.stream()
				.filter(s -> !s.isBefore(from) && s.isBefore(to))
				.filter(s -> !taken.contains(s))
				.toList();
	}

	private boolean doctorAllowsSlot(Long doctorId, Instant slotTime) {
		try {
			String uri = UriComponentsBuilder.fromHttpUrl(doctorBaseUrl)
					.path("/api/doctors/{doctorId}/availability/validate")
					.queryParam("slotTime", slotTime.toString())
					.buildAndExpand(doctorId)
					.toUriString();

			DoctorSlotValidationResponse resp = rest.getForObject(uri, DoctorSlotValidationResponse.class);
			return resp != null && resp.allowed();
		} catch (RestClientException ex) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Doctor availability service unavailable");
		}
	}

	private List<Instant> fetchDoctorSlots(Long doctorId, int days) {
		try {
			String uri = UriComponentsBuilder.fromHttpUrl(doctorBaseUrl)
					.path("/api/doctors/{doctorId}/availability/slots")
					.queryParam("days", days)
					.buildAndExpand(doctorId)
					.toUriString();
			Instant[] slots = rest.getForObject(uri, Instant[].class);
			if (slots == null) {
				return List.of();
			}
			return Arrays.asList(slots);
		} catch (RestClientException ex) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Doctor availability service unavailable");
		}
	}

	public record DoctorSlotValidationResponse(boolean allowed) {
	}

	@Transactional
	public Appointment cancel(Long appointmentId, Long requesterPatientId, boolean isAdmin) {
		Appointment appt = repo.findById(appointmentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));

		if (!isAdmin && !appt.getPatientId().equals(requesterPatientId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
		}
		if (appt.getStatus() == AppointmentStatus.CANCELLED) {
			return appt;
		}
		appt.setStatus(AppointmentStatus.CANCELLED);
		rabbit.convertAndSend(RabbitConfig.EXCHANGE, "appointment.cancelled",
				new AppointmentEvents.AppointmentCancelled(appt.getId(), appt.getPatientId(), appt.getDoctorId(), appt.getSlotTime()));
		return appt;
	}

	@Transactional
	public Appointment cancelAsDoctorUser(Long appointmentId, Long doctorUserId) {
		Appointment appt = repo.findById(appointmentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));

		Long doctorId = resolveDoctorIdForUser(doctorUserId);
		if (!doctorId.equals(appt.getDoctorId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
		}
		if (appt.getStatus() == AppointmentStatus.CANCELLED) {
			return appt;
		}

		appt.setStatus(AppointmentStatus.CANCELLED);
		rabbit.convertAndSend(RabbitConfig.EXCHANGE, "appointment.cancelled",
				new AppointmentEvents.AppointmentCancelled(appt.getId(), appt.getPatientId(), appt.getDoctorId(), appt.getSlotTime()));
		return appt;
	}

	public List<Appointment> listForPatient(Long patientId) {
		return repo.findByPatientId(patientId);
	}

	public List<Appointment> listForDoctorUser(Long doctorUserId) {
		Long doctorId = resolveDoctorIdForUser(doctorUserId);
		return repo.findByDoctorIdOrderBySlotTimeAsc(doctorId);
	}

	public List<Appointment> listAll() {
		return repo.findAll(Sort.by(Sort.Direction.DESC, "slotTime"));
	}

	public List<DoctorPatientWithReportsResponse> listConfirmedPatientsWithReportsForDoctorUser(Long doctorUserId) {
		Long doctorId = resolveDoctorIdForUser(doctorUserId);
		List<Appointment> confirmedAppointments = repo.findByDoctorIdAndStatusOrderBySlotTimeAsc(doctorId, AppointmentStatus.CONFIRMED);
		if (confirmedAppointments.isEmpty()) {
			return List.of();
		}

		List<Long> patientUserIds = confirmedAppointments.stream()
				.map(Appointment::getPatientId)
				.distinct()
				.toList();

		ResponseEntity<PatientWithReportsResponse[]> response;
		try {
			String uri = UriComponentsBuilder.fromHttpUrl(patientBaseUrl)
					.path("/api/patients/internal/patients-with-reports")
					.queryParam("userIds", patientUserIds.toArray())
					.toUriString();

			response = rest.exchange(uri, HttpMethod.GET, HttpEntity.EMPTY, PatientWithReportsResponse[].class);
		} catch (RestClientException ex) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Patient service unavailable");
		}

		PatientWithReportsResponse[] body = response.getBody();
		if (body == null || body.length == 0) {
			return patientUserIds.stream()
					.map(userId -> new DoctorPatientWithReportsResponse(userId, null, null, 0, List.of()))
					.toList();
		}

		return Arrays.stream(body)
				.filter(p -> p != null && p.userId() != null)
				.map(p -> new DoctorPatientWithReportsResponse(
						p.userId(),
						p.fullName(),
						p.phone(),
						(int) confirmedAppointments.stream().filter(a -> p.userId().equals(a.getPatientId())).count(),
						p.reports() == null ? List.of() : p.reports()
				))
				.toList();
	}

	public ResponseEntity<byte[]> downloadPatientReportForDoctorUser(Long doctorUserId, Long patientId, Long reportId) {
		if (patientId == null || patientId <= 0 || reportId == null || reportId <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid patientId or reportId");
		}

		Long doctorId = resolveDoctorIdForUser(doctorUserId);
		boolean allowed = repo.existsByDoctorIdAndPatientIdAndStatus(doctorId, patientId, AppointmentStatus.CONFIRMED);
		if (!allowed) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
		}

		try {
			String uri = UriComponentsBuilder.fromHttpUrl(patientBaseUrl)
					.path("/api/patients/internal/patients/{patientId}/reports/{reportId}/download")
					.buildAndExpand(patientId, reportId)
					.toUriString();

			ResponseEntity<byte[]> response = rest.exchange(uri, HttpMethod.GET, HttpEntity.EMPTY, byte[].class);
			byte[] body = response.getBody();
			if (body == null) {
				throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found");
			}

			HttpHeaders out = new HttpHeaders();
			MediaType ct = response.getHeaders().getContentType();
			out.setContentType(ct != null ? ct : MediaType.APPLICATION_OCTET_STREAM);
			long len = response.getHeaders().getContentLength();
			if (len >= 0) {
				out.setContentLength(len);
			}
			String disposition = response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION);
			if (disposition != null && !disposition.isBlank()) {
				out.set(HttpHeaders.CONTENT_DISPOSITION, disposition);
			}

			return new ResponseEntity<>(body, out, HttpStatus.OK);
		} catch (HttpStatusCodeException ex) {
			if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
				throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found");
			}
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Patient service unavailable");
		} catch (RestClientException ex) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Patient service unavailable");
		}
	}

	@Transactional
	public Appointment updateApprovalForDoctorUser(Long appointmentId, Long doctorUserId, AppointmentApproval appoinmentApproval) {
		if (appoinmentApproval == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "appoinmentApproval is required");
		}

		Long doctorId = resolveDoctorIdForUser(doctorUserId);
		Appointment appt = repo.findById(appointmentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Appointment not found"));

		if (!doctorId.equals(appt.getDoctorId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
		}

		if (appt.getStatus() == AppointmentStatus.CONFIRMED && appoinmentApproval == AppointmentApproval.DECLINED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot decline a confirmed appointment; cancel it instead");
		}

		appt.setAppoinmentApproval(appoinmentApproval);

		if (appoinmentApproval == AppointmentApproval.DECLINED && appt.getStatus() != AppointmentStatus.CANCELLED) {
			appt.setStatus(AppointmentStatus.CANCELLED);
			rabbit.convertAndSend(RabbitConfig.EXCHANGE, "appointment.cancelled",
					new AppointmentEvents.AppointmentCancelled(appt.getId(), appt.getPatientId(), appt.getDoctorId(), appt.getSlotTime()));
		}

		return appt;
	}

	private Long resolveDoctorIdForUser(Long doctorUserId) {
		try {
			String uri = UriComponentsBuilder.fromHttpUrl(doctorBaseUrl)
					.path("/api/doctors/me/profile")
					.toUriString();

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

	public record DoctorProfileResponse(Long id) {
	}

	public record MedicalReportRow(
			Long id,
			String fileName,
			String contentType,
			long sizeBytes,
			String description,
			Instant uploadedAt
	) {
	}

	public record PatientWithReportsResponse(
			Long userId,
			String fullName,
			String phone,
			List<MedicalReportRow> reports
	) {
	}

	public record DoctorPatientWithReportsResponse(
			Long patientId,
			String fullName,
			String phone,
			int confirmedAppointmentsCount,
			List<MedicalReportRow> reports
	) {
	}
}

