package lk.medilink.notification.messaging;

import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {
	public static final String EXCHANGE = "medilink.events";

	@Bean
	public TopicExchange eventsExchange() {
		return new TopicExchange(EXCHANGE);
	}

	@Bean
	public Declarables notificationBindings(TopicExchange exchange) {
		Queue appointmentCreated = new Queue("notification.appointment.created", true);
		Queue appointmentCancelled = new Queue("notification.appointment.cancelled", true);
		Queue appointmentConfirmed = new Queue("notification.appointment.confirmed", true);

		Queue doctorVerified = new Queue("notification.doctor.verified", true);
		Queue doctorRejected = new Queue("notification.doctor.rejected", true);

		Queue paymentCompleted = new Queue("notification.payment.completed", true);
		Queue paymentFailed = new Queue("notification.payment.failed", true);

		return new Declarables(
				appointmentCreated,
				appointmentCancelled,
				appointmentConfirmed,
				doctorVerified,
				doctorRejected,
				paymentCompleted,
				paymentFailed,
				BindingBuilder.bind(appointmentCreated).to(exchange).with("appointment.created"),
				BindingBuilder.bind(appointmentCancelled).to(exchange).with("appointment.cancelled"),
				BindingBuilder.bind(appointmentConfirmed).to(exchange).with("appointment.confirmed"),
				BindingBuilder.bind(doctorVerified).to(exchange).with("doctor.verified"),
				BindingBuilder.bind(doctorRejected).to(exchange).with("doctor.rejected"),
				BindingBuilder.bind(paymentCompleted).to(exchange).with("payment.completed"),
				BindingBuilder.bind(paymentFailed).to(exchange).with("payment.failed")
		);
	}
}

