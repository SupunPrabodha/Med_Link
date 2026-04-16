package lk.medilink.telemedicine.messaging;

import lk.medilink.telemedicine.service.ConsultationSessionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class AppointmentConfirmedEventHandler {
	private static final Logger log = LoggerFactory.getLogger(AppointmentConfirmedEventHandler.class);

	private final ConsultationSessionService sessions;
	private final ObjectMapper objectMapper;

	public AppointmentConfirmedEventHandler(ConsultationSessionService sessions, ObjectMapper objectMapper) {
		this.sessions = sessions;
		this.objectMapper = objectMapper;
	}

	@RabbitListener(queues = RabbitConfig.APPOINTMENT_CONFIRMED_QUEUE)
	public void onAppointmentConfirmed(byte[] payload) {
		AppointmentConfirmedEvent event;
		try {
			event = objectMapper.readValue(payload, AppointmentConfirmedEvent.class);
		} catch (Exception ex) {
			log.warn("appointment.confirmed payload invalid or unreadable", ex);
			return;
		}

		Long appointmentId = event.appointmentId();
		Long patientId = event.patientId();
		Long doctorId = event.doctorId();
		Instant slotTime = event.slotTime();

		if (appointmentId == null || patientId == null || doctorId == null || slotTime == null) {
			log.warn("appointment.confirmed payload invalid: {}", event);
			return;
		}

		sessions.autoCreateFromConfirmedAppointment(appointmentId, doctorId, patientId, slotTime);
	}

	public record AppointmentConfirmedEvent(Long appointmentId, Long patientId, Long doctorId, Instant slotTime, Instant confirmedAt) {
	}
}
