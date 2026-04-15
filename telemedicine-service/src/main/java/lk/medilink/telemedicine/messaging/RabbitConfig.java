package lk.medilink.telemedicine.messaging;

import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {
	public static final String EXCHANGE = "medilink.events";
	public static final String APPOINTMENT_CONFIRMED_QUEUE = "telemedicine.appointment.confirmed";

	@Bean
	public TopicExchange eventsExchange() {
		return new TopicExchange(EXCHANGE);
	}

	@Bean
	public Declarables telemedicineBindings(TopicExchange exchange) {
		Queue confirmedQueue = new Queue(APPOINTMENT_CONFIRMED_QUEUE, true);

		return new Declarables(
				confirmedQueue,
				BindingBuilder.bind(confirmedQueue).to(exchange).with("appointment.confirmed")
		);
	}
}
