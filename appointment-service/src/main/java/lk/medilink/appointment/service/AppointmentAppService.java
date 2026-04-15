package lk.medilink.appointment.service;

import lk.medilink.appointment.domain.Appointment;
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

import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AppointmentAppService {
	private static final int MAX_DAYS = 30;
	private final AppointmentRepository repo;
	private final RabbitTemplate rabbit;
	private final RestTemplate rest;
	private final String doctorBaseUrl;

	public AppointmentAppService(AppointmentRepository repo,
	                            RabbitTemplate rabbit,
	                            RestTemplateBuilder restTemplateBuilder,
	                            @Value("${app.doctor-base-url:http://localhost:8084}") String doctorBaseUrl) {
		this.repo = repo;
		this.rabbit = rabbit;
		this.rest = restTemplateBuilder
				.setConnectTimeout(Duration.ofSeconds(2))
				.setReadTimeout(Duration.ofSeconds(5))
				.build();
		this.doctorBaseUrl = doctorBaseUrl;
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
		appt.setStatus(AppointmentStatus.CANCELLED);
		rabbit.convertAndSend(RabbitConfig.EXCHANGE, "appointment.cancelled",
				new AppointmentEvents.AppointmentCancelled(appt.getId(), appt.getPatientId(), appt.getDoctorId(), appt.getSlotTime()));
		return appt;
	}

	public List<Appointment> listForPatient(Long patientId) {
		return repo.findByPatientId(patientId);
	}

	public List<Appointment> listAll() {
		return repo.findAll(Sort.by(Sort.Direction.DESC, "slotTime"));
	}
}

