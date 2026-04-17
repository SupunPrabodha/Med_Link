package lk.medilink.appointment.messaging;

import lk.medilink.appointment.domain.Appointment;
import lk.medilink.appointment.domain.AppointmentApproval;
import lk.medilink.appointment.domain.AppointmentStatus;
import lk.medilink.appointment.realtime.AppointmentSseHub;
import lk.medilink.appointment.repo.AppointmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Map;

@Component
public class PaymentEventHandlers {
	private static final Logger log = LoggerFactory.getLogger(PaymentEventHandlers.class);

	private final AppointmentRepository repo;
	private final RabbitTemplate rabbit;
	private final AppointmentSseHub sse;

	public PaymentEventHandlers(AppointmentRepository repo, RabbitTemplate rabbit, AppointmentSseHub sse) {
		this.repo = repo;
		this.rabbit = rabbit;
		this.sse = sse;
	}

	@RabbitListener(queues = "appointment.payment.completed")
	@Transactional
	public void onPaymentCompleted(Map<String, Object> event) {
		Object v = event.get("appointmentId");
		if (v == null) {
			log.warn("payment.completed event missing appointmentId: {}", event);
			return;
		}
		Long appointmentId = Long.valueOf(v.toString());

		Appointment appt = repo.findById(appointmentId).orElse(null);
		if (appt == null) {
			log.warn("Appointment not found for payment.completed: appointmentId={}", appointmentId);
			return;
		}
		if (appt.getStatus() == AppointmentStatus.CONFIRMED) {
			return;
		}
		if (appt.getStatus() == AppointmentStatus.CANCELLED) {
			log.warn("Ignoring payment.completed for cancelled appointment: appointmentId={}", appointmentId);
			return;
		}
		if (appt.getAppoinmentApproval() == null) {
			log.warn("Ignoring payment.completed for unapproved appointment: appointmentId={}", appointmentId);
			return;
		}
		if (appt.getAppoinmentApproval() == AppointmentApproval.DECLINED) {
			log.warn("Ignoring payment.completed for declined appointment: appointmentId={}", appointmentId);
			return;
		}
		appt.setStatus(AppointmentStatus.CONFIRMED);
		repo.save(appt);
		sse.publish(appt);

		rabbit.convertAndSend(RabbitConfig.EXCHANGE, "appointment.confirmed",
				new AppointmentEvents.AppointmentConfirmed(appt.getId(), appt.getPatientId(), appt.getDoctorId(), appt.getSlotTime(), Instant.now()));
	}
}

