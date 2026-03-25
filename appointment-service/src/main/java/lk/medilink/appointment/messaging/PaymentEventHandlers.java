package lk.medilink.appointment.messaging;

import lk.medilink.appointment.domain.Appointment;
import lk.medilink.appointment.domain.AppointmentStatus;
import lk.medilink.appointment.repo.AppointmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Component
public class PaymentEventHandlers {
	private static final Logger log = LoggerFactory.getLogger(PaymentEventHandlers.class);

	public record PaymentCompleted(Long paymentId, Long appointmentId) {
	}

	private final AppointmentRepository repo;
	private final RabbitTemplate rabbit;

	public PaymentEventHandlers(AppointmentRepository repo, RabbitTemplate rabbit) {
		this.repo = repo;
		this.rabbit = rabbit;
	}

	@RabbitListener(queues = "appointment.payment.completed")
	@Transactional
	public void onPaymentCompleted(Object event) {
		// We keep this loosely typed to avoid tight coupling; we only need appointmentId.
		// Spring will deserialize to LinkedHashMap for JSON; handle both map and record.
		Long appointmentId = null;
		if (event instanceof java.util.Map<?, ?> m) {
			Object v = m.get("appointmentId");
			if (v != null) appointmentId = Long.valueOf(v.toString());
		} else if (event instanceof PaymentCompleted pc) {
			appointmentId = pc.appointmentId();
		}
		if (appointmentId == null) {
			log.warn("payment.completed event missing appointmentId: {}", event);
			return;
		}

		Appointment appt = repo.findById(appointmentId).orElse(null);
		if (appt == null) {
			log.warn("Appointment not found for payment.completed: appointmentId={}", appointmentId);
			return;
		}
		if (appt.getStatus() == AppointmentStatus.CONFIRMED) {
			return;
		}
		appt.setStatus(AppointmentStatus.CONFIRMED);
		repo.save(appt);

		rabbit.convertAndSend(RabbitConfig.EXCHANGE, "appointment.confirmed",
				new AppointmentEvents.AppointmentConfirmed(appt.getId(), appt.getPatientId(), appt.getDoctorId(), appt.getSlotTime(), Instant.now()));
	}
}

