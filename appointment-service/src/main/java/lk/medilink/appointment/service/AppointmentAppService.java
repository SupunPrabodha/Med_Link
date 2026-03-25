package lk.medilink.appointment.service;

import lk.medilink.appointment.domain.Appointment;
import lk.medilink.appointment.domain.AppointmentStatus;
import lk.medilink.appointment.messaging.AppointmentEvents;
import lk.medilink.appointment.messaging.RabbitConfig;
import lk.medilink.appointment.repo.AppointmentRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class AppointmentAppService {
	private final AppointmentRepository repo;
	private final RabbitTemplate rabbit;

	public AppointmentAppService(AppointmentRepository repo, RabbitTemplate rabbit) {
		this.repo = repo;
		this.rabbit = rabbit;
	}

	@Transactional
	public Appointment create(Long patientId, Long doctorId, Instant slotTime) {
		Appointment saved = repo.save(new Appointment(patientId, doctorId, slotTime, AppointmentStatus.PENDING_PAYMENT));
		rabbit.convertAndSend(RabbitConfig.EXCHANGE, "appointment.created",
				new AppointmentEvents.AppointmentCreated(saved.getId(), patientId, doctorId, slotTime));
		return saved;
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
}

