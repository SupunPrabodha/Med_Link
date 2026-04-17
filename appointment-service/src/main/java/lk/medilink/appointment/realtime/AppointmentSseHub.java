package lk.medilink.appointment.realtime;

import lk.medilink.appointment.domain.Appointment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AppointmentSseHub {
	private static final Logger log = LoggerFactory.getLogger(AppointmentSseHub.class);
	private static final long EMITTER_TIMEOUT_MS = 30L * 60L * 1000L;

	private final Map<Long, Set<SseEmitter>> patientEmitters = new ConcurrentHashMap<>();
	private final Map<Long, Set<SseEmitter>> doctorEmitters = new ConcurrentHashMap<>();
	private final Set<SseEmitter> adminEmitters = ConcurrentHashMap.newKeySet();

	public SseEmitter registerPatient(Long patientUserId) {
		return register(patientEmitters, patientUserId, "patient");
	}

	public SseEmitter registerDoctor(Long doctorId) {
		return register(doctorEmitters, doctorId, "doctor");
	}

	public SseEmitter registerAdmin() {
		SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
		adminEmitters.add(emitter);
		wireLifecycle(emitter, () -> adminEmitters.remove(emitter));
		sendConnected(emitter, "admin");
		return emitter;
	}

	public void publish(Appointment appt) {
		if (appt == null || appt.getId() == null) {
			return;
		}
		publishToSet(patientEmitters.get(appt.getPatientId()), appt);
		publishToSet(doctorEmitters.get(appt.getDoctorId()), appt);
		publishToSet(adminEmitters, appt);
	}

	private SseEmitter register(Map<Long, Set<SseEmitter>> map, Long key, String kind) {
		SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
		map.computeIfAbsent(key, __ -> ConcurrentHashMap.newKeySet()).add(emitter);
		wireLifecycle(emitter, () -> remove(map, key, emitter));
		sendConnected(emitter, kind);
		return emitter;
	}

	private void remove(Map<Long, Set<SseEmitter>> map, Long key, SseEmitter emitter) {
		Set<SseEmitter> set = map.get(key);
		if (set != null) {
			set.remove(emitter);
			if (set.isEmpty()) {
				map.remove(key);
			}
		}
	}

	private void wireLifecycle(SseEmitter emitter, Runnable cleanup) {
		emitter.onCompletion(cleanup);
		emitter.onTimeout(cleanup);
		emitter.onError(__ -> cleanup.run());
	}

	private void sendConnected(SseEmitter emitter, String kind) {
		try {
			emitter.send(SseEmitter.event().name("connected").data(kind, MediaType.TEXT_PLAIN));
		} catch (IOException ex) {
			log.debug("SSE connected send failed: {}", ex.getMessage());
			emitter.complete();
		}
	}

	private void publishToSet(Set<SseEmitter> emitters, Appointment appt) {
		if (emitters == null || emitters.isEmpty()) {
			return;
		}

		String eventId = appt.getId() + "-" + Instant.now().toEpochMilli();
		SseEmitter.SseEventBuilder event = SseEmitter.event()
				.id(eventId)
				.name("appointment")
				.data(appt, MediaType.APPLICATION_JSON);

		for (SseEmitter emitter : emitters) {
			try {
				emitter.send(event);
			} catch (IOException ex) {
				emitter.complete();
			}
		}
	}
}
