package lk.medilink.payment.messaging;

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
	public Declarables paymentBindings(TopicExchange exchange) {
		Queue paymentCompleted = new Queue("notification.payment.completed", true);
		Queue paymentFailed = new Queue("notification.payment.failed", true);

		return new Declarables(
				paymentCompleted,
				paymentFailed,
				BindingBuilder.bind(paymentCompleted).to(exchange).with("payment.completed"),
				BindingBuilder.bind(paymentFailed).to(exchange).with("payment.failed")
		);
	}
}
