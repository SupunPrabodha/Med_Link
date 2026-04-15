package lk.medilink.telemedicine.messaging;

import lk.medilink.telemedicine.service.TelemedicineAppService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;

@Component
public class AppointmentEventHandlers {
	private static final Logger log = LoggerFactory.getLogger(AppointmentEventHandlers.class);

	private final TelemedicineAppService service;

	public AppointmentEventHandlers(TelemedicineAppService service) {
		this.service = service;
	}

	@RabbitListener(queues = "telemedicine.appointment.confirmed")
	public void onAppointmentConfirmed(Map<String, Object> event) {
		Object apptIdV = event.get("appointmentId");
		Object patientIdV = event.get("patientId");
		Object doctorIdV = event.get("doctorId");
		Object slotTimeV = event.get("slotTime");

		if (apptIdV == null || patientIdV == null || doctorIdV == null || slotTimeV == null) {
			log.warn("appointment.confirmed missing required fields: {}", event);
			return;
		}

		Long appointmentId = Long.valueOf(apptIdV.toString());
		Long patientId = Long.valueOf(patientIdV.toString());
		Long doctorId = Long.valueOf(doctorIdV.toString());
		Instant slotTime = Instant.parse(slotTimeV.toString());

		service.upsertFromConfirmedAppointment(appointmentId, patientId, doctorId, slotTime);
	}

	@RabbitListener(queues = "telemedicine.appointment.cancelled")
	public void onAppointmentCancelled(Map<String, Object> event) {
		Object apptIdV = event.get("appointmentId");
		if (apptIdV == null) {
			log.warn("appointment.cancelled missing appointmentId: {}", event);
			return;
		}
		Long appointmentId = Long.valueOf(apptIdV.toString());
		service.cancelByAppointmentId(appointmentId);
	}
}
