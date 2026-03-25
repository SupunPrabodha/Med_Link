package lk.medilink.appointment;

import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

// Kept for potential Spring context tests later.
@TestConfiguration
public class TestDependencies {
	@Bean
	org.springframework.amqp.rabbit.core.RabbitTemplate rabbitTemplate() {
		return Mockito.mock(org.springframework.amqp.rabbit.core.RabbitTemplate.class);
	}
}

