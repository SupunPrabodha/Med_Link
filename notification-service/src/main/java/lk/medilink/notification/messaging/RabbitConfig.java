package lk.medilink.notification.messaging;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitConfig {
	@Bean
	public TopicExchange eventsExchange() {
		return new TopicExchange("medilink.events");
	}
}

