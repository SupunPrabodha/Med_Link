package lk.medilink.telemedicine.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "telemedicine_sessions")
public class TelemedicineSession {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private Long appointmentId;

	@Column(nullable = false)
	private Long patientUserId;

	@Column(nullable = false)
	private Long doctorId;

	@Column(nullable = false)
	private Instant slotTime;

	@Column(nullable = false)
	private String roomName;

	@Column(nullable = false)
	private String joinUrl;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private SessionStatus status;

	@Column(nullable = false)
	private Instant createdAt;

	@Column(nullable = true)
	private Instant completedAt;

	@Column(nullable = true)
	private Instant cancelledAt;

	protected TelemedicineSession() {
	}

	public TelemedicineSession(Long appointmentId, Long patientUserId, Long doctorId, Instant slotTime, String roomName, String joinUrl) {
		this.appointmentId = appointmentId;
		this.patientUserId = patientUserId;
		this.doctorId = doctorId;
		this.slotTime = slotTime;
		this.roomName = roomName;
		this.joinUrl = joinUrl;
		this.status = SessionStatus.ACTIVE;
		this.createdAt = Instant.now();
		this.completedAt = null;
		this.cancelledAt = null;
	}

	public Long getId() {
		return id;
	}

	public Long getAppointmentId() {
		return appointmentId;
	}

	public Long getPatientUserId() {
		return patientUserId;
	}

	public Long getDoctorId() {
		return doctorId;
	}

	public Instant getSlotTime() {
		return slotTime;
	}

	public String getRoomName() {
		return roomName;
	}

	public String getJoinUrl() {
		return joinUrl;
	}

	public SessionStatus getStatus() {
		return status;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getCompletedAt() {
		return completedAt;
	}

	public Instant getCancelledAt() {
		return cancelledAt;
	}

	public void reactivate(Long patientUserId, Long doctorId, Instant slotTime, String roomName, String joinUrl) {
		this.patientUserId = patientUserId;
		this.doctorId = doctorId;
		this.slotTime = slotTime;
		this.roomName = roomName;
		this.joinUrl = joinUrl;
		this.status = SessionStatus.ACTIVE;
		this.completedAt = null;
		this.cancelledAt = null;
	}

	public void cancel() {
		if (this.status == SessionStatus.CANCELLED || this.status == SessionStatus.COMPLETED) {
			return;
		}
		this.status = SessionStatus.CANCELLED;
		this.cancelledAt = Instant.now();
	}

	public boolean complete() {
		if (this.status == SessionStatus.COMPLETED || this.status == SessionStatus.CANCELLED) {
			return false;
		}
		this.status = SessionStatus.COMPLETED;
		this.completedAt = Instant.now();
		return true;
	}
}
