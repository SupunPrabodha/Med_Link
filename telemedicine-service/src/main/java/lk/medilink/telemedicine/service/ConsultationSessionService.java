package lk.medilink.telemedicine.service;

import lk.medilink.telemedicine.domain.ConsultationAuditAction;
import lk.medilink.telemedicine.domain.ConsultationAuditLog;
import lk.medilink.telemedicine.domain.ConsultationSession;
import lk.medilink.telemedicine.domain.ConsultationSessionStatus;
import lk.medilink.telemedicine.web.dto.ConsultationJoinResponse;
import lk.medilink.telemedicine.repo.ConsultationAuditLogRepository;
import lk.medilink.telemedicine.repo.ConsultationSessionRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import javax.crypto.SecretKey;

@Service
public class ConsultationSessionService {
	private static final Logger log = LoggerFactory.getLogger(ConsultationSessionService.class);

	private final ConsultationSessionRepository sessions;
	private final ConsultationAuditService auditService;
	private final String jitsiDomain;
	private final SecretKey joinTokenKey;
	private final Duration joinTokenTtl;
	private final Duration joinWindowBefore;
	private final Duration joinWindowAfter;

	public ConsultationSessionService(ConsultationSessionRepository sessions,
	                                 ConsultationAuditService auditService,
	                                 @Value("${app.telemedicine.jitsi-domain:meet.jit.si}") String jitsiDomain,
	                                 @Value("${app.telemedicine.join-token-secret:change-me-to-a-long-telemedicine-join-token-secret}") String joinTokenSecret,
	                                 @Value("${app.telemedicine.join-token-ttl-minutes:15}") long joinTokenTtlMinutes,
	                                 @Value("${app.telemedicine.join-window-before-minutes:10}") long joinWindowBeforeMinutes,
	                                 @Value("${app.telemedicine.join-window-after-minutes:60}") long joinWindowAfterMinutes) {
		this.sessions = sessions;
		this.auditService = auditService;
		this.jitsiDomain = jitsiDomain;
		this.joinTokenKey = Keys.hmacShaKeyFor(joinTokenSecret.getBytes(StandardCharsets.UTF_8));
		this.joinTokenTtl = Duration.ofMinutes(joinTokenTtlMinutes);
		this.joinWindowBefore = Duration.ofMinutes(joinWindowBeforeMinutes);
		this.joinWindowAfter = Duration.ofMinutes(joinWindowAfterMinutes);
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
			auditService.recordSystemAction(session.getId(), ConsultationAuditAction.SESSION_CREATED, "Auto-created from appointment.confirmed");
		} catch (DataIntegrityViolationException ex) {
			// Unique constraint on appointmentId keeps this idempotent under concurrent deliveries.
			log.info("Consultation session already exists for appointmentId={}, ignoring duplicate event", appointmentId);
		}
	}

	@Transactional
	public ConsultationJoinResponse issueJoinAccess(Long sessionId, Long userId) {
		if (sessionId == null || sessionId <= 0 || userId == null || userId <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid sessionId or userId");
		}

		ConsultationSession session = sessions.findById(sessionId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Consultation session not found"));

		Instant now = Instant.now();
		if (!isParticipant(session, userId)) {
			auditService.recordUserAction(session.getId(), userId, ConsultationAuditAction.JOIN_DENIED, "User is not a participant");
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
		}
		if (session.getStatus() == ConsultationSessionStatus.CANCELLED || session.getStatus() == ConsultationSessionStatus.ENDED) {
			auditService.recordUserAction(session.getId(), userId, ConsultationAuditAction.JOIN_DENIED, "Session is closed");
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Session is closed");
		}
		if (!isWithinJoinWindow(session.getScheduledStartTime(), now)) {
			auditService.recordUserAction(session.getId(), userId, ConsultationAuditAction.JOIN_DENIED, "Outside join window");
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Session is not open for joining yet");
		}

		if (session.getStatus() == ConsultationSessionStatus.SCHEDULED) {
			session.setStatus(ConsultationSessionStatus.ACTIVE);
		}
		if (session.getStartedAt() == null) {
			session.setStartedAt(now);
		}
		sessions.save(session);

		String role = session.getDoctorUserId().equals(userId) ? "DOCTOR" : "PATIENT";
		String displayName = role + "-" + userId;
		Instant expiresAt = now.plus(joinTokenTtl);
		String joinToken = buildJoinToken(session, userId, role, displayName, now, expiresAt);

		auditService.recordUserAction(session.getId(), userId, ConsultationAuditAction.JOIN_TOKEN_ISSUED, "Join token issued for role=" + role);

		return new ConsultationJoinResponse(
				session.getId(),
				session.getAppointmentId(),
				session.getDoctorUserId(),
				session.getPatientUserId(),
				session.getRoomId(),
				buildMeetingUrl(session.getRoomId()),
				jitsiDomain,
				joinToken,
				role,
				displayName,
				session.getScheduledStartTime(),
				expiresAt,
				session.getStatus().name()
		);
	}

	private String buildRoomId(Long appointmentId) {
		return "medlink-appt-" + appointmentId;
	}

	private boolean isParticipant(ConsultationSession session, Long userId) {
		return session.getDoctorUserId().equals(userId) || session.getPatientUserId().equals(userId);
	}

	private boolean isWithinJoinWindow(Instant scheduledStartTime, Instant now) {
		Instant opensAt = scheduledStartTime.minus(joinWindowBefore);
		Instant closesAt = scheduledStartTime.plus(joinWindowAfter);
		return !now.isBefore(opensAt) && !now.isAfter(closesAt);
	}

	private String buildJoinToken(ConsultationSession session,
	                             Long userId,
	                             String role,
	                             String displayName,
	                             Instant now,
	                             Instant expiresAt) {
		return Jwts.builder()
				.issuer("telemedicine-service")
				.subject("consultation-session-" + session.getId())
				.issuedAt(Date.from(now))
				.notBefore(Date.from(now))
				.expiration(Date.from(expiresAt))
				.claim("sessionId", session.getId())
				.claim("appointmentId", session.getAppointmentId())
				.claim("userId", userId)
				.claim("roomId", session.getRoomId())
				.claim("role", role)
				.claim("displayName", displayName)
				.claim("jitsiDomain", jitsiDomain)
				.signWith(joinTokenKey)
				.compact();
	}

	private String buildMeetingUrl(String roomId) {
		String domain = jitsiDomain.contains("://") ? jitsiDomain : "https://" + jitsiDomain;
		return domain.endsWith("/") ? domain + roomId : domain + "/" + roomId;
	}
}
