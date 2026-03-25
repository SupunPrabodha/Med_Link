package lk.medilink.doctor.messaging;

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
	public Declarables doctorBindings(TopicExchange exchange) {
		Queue verified = new Queue("notification.doctor.verified", true);
		Queue rejected = new Queue("notification.doctor.rejected", true);
		return new Declarables(
				verified,
				rejected,
				BindingBuilder.bind(verified).to(exchange).with("doctor.verified"),
				BindingBuilder.bind(rejected).to(exchange).with("doctor.rejected")
		);
	}
}

