package lk.medilink.notification.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class AmqpJsonConfig {
	@Bean
	public MessageConverter messageConverter(ObjectMapper objectMapper) {
		Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter(objectMapper);
		DefaultJackson2JavaTypeMapper typeMapper = new DefaultJackson2JavaTypeMapper();
		// Consumers shouldn't depend on producer service classes; prefer listener method parameter type.
		typeMapper.setTypePrecedence(Jackson2JavaTypeMapper.TypePrecedence.INFERRED);
		typeMapper.setTrustedPackages("java.util", "java.lang", "lk.medilink.notification.messaging");
		// Fallback: map known producer type ids to local DTO record types.
		typeMapper.setIdClassMapping(Map.of(
				"lk.medilink.payment.messaging.PaymentEvents$PaymentCompleted", PaymentEventHandlers.PaymentCompleted.class,
				"lk.medilink.payment.messaging.PaymentEvents$PaymentFailed", PaymentEventHandlers.PaymentFailed.class,
				"lk.medilink.appointment.messaging.AppointmentEvents$AppointmentCreated", AppointmentEventHandlers.AppointmentCreated.class,
				"lk.medilink.appointment.messaging.AppointmentEvents$AppointmentCancelled", AppointmentEventHandlers.AppointmentCancelled.class,
				"lk.medilink.appointment.messaging.AppointmentEvents$AppointmentConfirmed", AppointmentEventHandlers.AppointmentConfirmed.class,
				"lk.medilink.doctor.messaging.DoctorEvents$DoctorVerified", DoctorEventHandlers.DoctorVerified.class,
				"lk.medilink.doctor.messaging.DoctorEvents$DoctorRejected", DoctorEventHandlers.DoctorRejected.class
		));
		converter.setJavaTypeMapper(typeMapper);
		return converter;
	}

	@Bean
	public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter messageConverter) {
		RabbitTemplate template = new RabbitTemplate(connectionFactory);
		template.setMessageConverter(messageConverter);
		return template;
	}

	@Bean
	public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(ConnectionFactory connectionFactory,
			MessageConverter messageConverter) {
		SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
		factory.setConnectionFactory(connectionFactory);
		factory.setMessageConverter(messageConverter);
		return factory;
	}
}
