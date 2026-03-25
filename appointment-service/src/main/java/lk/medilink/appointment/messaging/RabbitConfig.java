package lk.medilink.appointment.messaging;

import org.springframework.amqp.core.*;
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
	public Declarables appointmentBindings(TopicExchange exchange) {
		Queue createdQueue = new Queue("notification.appointment.created", true);
		Queue cancelledQueue = new Queue("notification.appointment.cancelled", true);
		Queue confirmedQueue = new Queue("notification.appointment.confirmed", true);
		Queue paymentCompletedQueue = new Queue("appointment.payment.completed", true);

		return new Declarables(
				createdQueue,
				cancelledQueue,
				confirmedQueue,
				paymentCompletedQueue,
				BindingBuilder.bind(createdQueue).to(exchange).with("appointment.created"),
				BindingBuilder.bind(cancelledQueue).to(exchange).with("appointment.cancelled"),
				BindingBuilder.bind(confirmedQueue).to(exchange).with("appointment.confirmed"),
				BindingBuilder.bind(paymentCompletedQueue).to(exchange).with("payment.completed")
		);
	}
}
