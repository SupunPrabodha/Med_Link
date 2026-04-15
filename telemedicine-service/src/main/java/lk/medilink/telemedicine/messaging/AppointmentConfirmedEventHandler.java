package lk.medilink.telemedicine.messaging;

import lk.medilink.telemedicine.service.ConsultationSessionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

@Component
public class AppointmentConfirmedEventHandler {
	private static final Logger log = LoggerFactory.getLogger(AppointmentConfirmedEventHandler.class);

	private final ConsultationSessionService sessions;

	public AppointmentConfirmedEventHandler(ConsultationSessionService sessions) {
		this.sessions = sessions;
	}

	@RabbitListener(queues = RabbitConfig.APPOINTMENT_CONFIRMED_QUEUE)
	public void onAppointmentConfirmed(Map<String, Object> event) {
		Long appointmentId = toLong(event.get("appointmentId"));
		Long patientId = toLong(event.get("patientId"));
		Long doctorId = toLong(event.get("doctorId"));
		Instant slotTime = toInstant(event.get("slotTime"));

		if (appointmentId == null || patientId == null || doctorId == null || slotTime == null) {
			log.warn("appointment.confirmed payload invalid: {}", event);
			return;
		}

		sessions.autoCreateFromConfirmedAppointment(appointmentId, doctorId, patientId, slotTime);
	}

	private Long toLong(Object value) {
		if (value == null) {
			return null;
		}
		try {
			return Long.valueOf(value.toString());
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	private Instant toInstant(Object value) {
		if (value == null) {
			return null;
		}
		try {
			return Instant.parse(value.toString());
		} catch (Exception ex) {
			return null;
		}
	}
}
