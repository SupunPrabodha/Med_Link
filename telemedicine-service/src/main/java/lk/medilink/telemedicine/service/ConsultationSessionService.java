package lk.medilink.telemedicine.service;

import lk.medilink.telemedicine.domain.ConsultationAuditAction;
import lk.medilink.telemedicine.domain.ConsultationAuditLog;
import lk.medilink.telemedicine.domain.ConsultationSession;
import lk.medilink.telemedicine.domain.ConsultationSessionStatus;
import lk.medilink.telemedicine.repo.ConsultationAuditLogRepository;
import lk.medilink.telemedicine.repo.ConsultationSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class ConsultationSessionService {
	private static final Logger log = LoggerFactory.getLogger(ConsultationSessionService.class);

	private final ConsultationSessionRepository sessions;
	private final ConsultationAuditLogRepository auditLogs;

	public ConsultationSessionService(ConsultationSessionRepository sessions,
	                                 ConsultationAuditLogRepository auditLogs) {
		this.sessions = sessions;
		this.auditLogs = auditLogs;
	}

	@Transactional
	public void autoCreateFromConfirmedAppointment(Long appointmentId,
	                                               Long doctorUserId,
	                                               Long patientUserId,
	                                               Instant slotTime) {
		if (appointmentId == null || doctorUserId == null || patientUserId == null || slotTime == null) {
			log.warn("Skipping auto-create: incomplete confirmed appointment payload appointmentId={}, doctorUserId={}, patientUserId={}, slotTime={}",
					appointmentId, doctorUserId, patientUserId, slotTime);
			return;
		}

		if (sessions.findByAppointmentId(appointmentId).isPresent()) {
			return;
		}

		ConsultationSession session = new ConsultationSession(
				appointmentId,
				doctorUserId,
				patientUserId,
				buildRoomId(appointmentId),
				ConsultationSessionStatus.SCHEDULED,
				slotTime
		);

		try {
			session = sessions.save(session);
			auditLogs.save(new ConsultationAuditLog(
					session.getId(),
					0L,
					ConsultationAuditAction.SESSION_CREATED,
					"Auto-created from appointment.confirmed"
			));
		} catch (DataIntegrityViolationException ex) {
			// Unique constraint on appointmentId keeps this idempotent under concurrent deliveries.
			log.info("Consultation session already exists for appointmentId={}, ignoring duplicate event", appointmentId);
		}
	}

	private String buildRoomId(Long appointmentId) {
		return "medlink-appt-" + appointmentId;
	}
}
