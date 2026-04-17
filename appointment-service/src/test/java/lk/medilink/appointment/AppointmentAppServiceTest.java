package lk.medilink.appointment;

import lk.medilink.appointment.repo.AppointmentRepository;
import lk.medilink.appointment.realtime.AppointmentSseHub;
import lk.medilink.appointment.service.AppointmentAppService;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AppointmentAppServiceTest {
	@Test
	void create_publishesEvent() {
		AppointmentRepository repo = mock(AppointmentRepository.class);
		RabbitTemplate rabbit = mock(RabbitTemplate.class);
		RestTemplateBuilder builder = mock(RestTemplateBuilder.class);
		AppointmentSseHub sseHub = mock(AppointmentSseHub.class);
		RestTemplate rest = mock(RestTemplate.class);
		when(builder.setConnectTimeout(any())).thenReturn(builder);
		when(builder.setReadTimeout(any())).thenReturn(builder);
		when(builder.build()).thenReturn(rest);
		when(rest.getForObject(anyString(), eq(AppointmentAppService.DoctorSlotValidationResponse.class)))
				.thenReturn(new AppointmentAppService.DoctorSlotValidationResponse(true));

		AppointmentAppService svc = new AppointmentAppService(
			repo,
			rabbit,
			builder,
			sseHub,
			"http://doctor-service:8084",
			"http://patient-service:8086"
		);

		when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));

		svc.create(1L, 2L, Instant.now().plusSeconds(3600));

		verify(rabbit, times(1)).convertAndSend(
			eq("medilink.events"),
			eq("appointment.created"),
			any(Object.class)
		);
	}
}
