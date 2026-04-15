package lk.medilink.telemedicine.messaging;

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
	public Declarables telemedicineBindings(TopicExchange exchange) {
		Queue confirmedQueue = new Queue("telemedicine.appointment.confirmed", true);
		Queue cancelledQueue = new Queue("telemedicine.appointment.cancelled", true);

		return new Declarables(
				confirmedQueue,
				cancelledQueue,
				BindingBuilder.bind(confirmedQueue).to(exchange).with("appointment.confirmed"),
				BindingBuilder.bind(cancelledQueue).to(exchange).with("appointment.cancelled")
		);
	}
}
