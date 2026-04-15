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
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(
		name = "consultation_sessions",
		uniqueConstraints = {
				@UniqueConstraint(name = "uk_consultation_sessions_appointment", columnNames = "appointmentId")
		},
		indexes = {
				@Index(name = "idx_consultation_sessions_doctor_start", columnList = "doctorUserId,scheduledStartTime"),
				@Index(name = "idx_consultation_sessions_patient_start", columnList = "patientUserId,scheduledStartTime"),
				@Index(name = "idx_consultation_sessions_status", columnList = "status")
		}
)
public class ConsultationSession {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long appointmentId;

	@Column(nullable = false)
	private Long doctorUserId;

	@Column(nullable = false)
	private Long patientUserId;

	@Column(nullable = false, length = 128)
	private String roomId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private ConsultationSessionStatus status;

	@Column(nullable = false)
	private Instant scheduledStartTime;

	@Column(nullable = false, updatable = false)
	private Instant createdAt;

	@Column
	private Instant startedAt;

	@Column
	private Instant endedAt;

	protected ConsultationSession() {
	}

	public ConsultationSession(Long appointmentId,
	                          Long doctorUserId,
	                          Long patientUserId,
	                          String roomId,
	                          ConsultationSessionStatus status,
	                          Instant scheduledStartTime) {
		this.appointmentId = appointmentId;
		this.doctorUserId = doctorUserId;
		this.patientUserId = patientUserId;
		this.roomId = roomId;
		this.status = status;
		this.scheduledStartTime = scheduledStartTime;
	}

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}

	public Long getId() {
		return id;
	}

	public Long getAppointmentId() {
		return appointmentId;
	}

	public Long getDoctorUserId() {
		return doctorUserId;
	}

	public Long getPatientUserId() {
		return patientUserId;
	}

	public String getRoomId() {
		return roomId;
	}

	public ConsultationSessionStatus getStatus() {
		return status;
	}

	public Instant getScheduledStartTime() {
		return scheduledStartTime;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getStartedAt() {
		return startedAt;
	}

	public Instant getEndedAt() {
		return endedAt;
	}

	public void setStatus(ConsultationSessionStatus status) {
		this.status = status;
	}

	public void setStartedAt(Instant startedAt) {
		this.startedAt = startedAt;
	}

	public void setEndedAt(Instant endedAt) {
		this.endedAt = endedAt;
	}
}
