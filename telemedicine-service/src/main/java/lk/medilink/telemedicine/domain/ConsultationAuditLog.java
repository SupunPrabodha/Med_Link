package lk.medilink.telemedicine.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(
		name = "consultation_audit_logs",
		indexes = {
				@Index(name = "idx_consultation_audit_logs_session_time", columnList = "sessionId,occurredAt")
		}
)
public class ConsultationAuditLog {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long sessionId;

	@Column(nullable = false)
	private Long actorUserId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 48)
	private ConsultationAuditAction action;

	@Column(nullable = false, length = 512)
	private String details;

	@Column(nullable = false, updatable = false)
	private Instant occurredAt;

	protected ConsultationAuditLog() {
	}

	public ConsultationAuditLog(Long sessionId, Long actorUserId, ConsultationAuditAction action, String details) {
		this.sessionId = sessionId;
		this.actorUserId = actorUserId;
		this.action = action;
		this.details = details;
	}

	@PrePersist
	void onCreate() {
		if (occurredAt == null) {
			occurredAt = Instant.now();
		}
	}

	public Long getId() {
		return id;
	}

	public Long getSessionId() {
		return sessionId;
	}

	public Long getActorUserId() {
		return actorUserId;
	}

	public ConsultationAuditAction getAction() {
		return action;
	}

	public String getDetails() {
		return details;
	}

	public Instant getOccurredAt() {
		return occurredAt;
	}
}
