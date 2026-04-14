package lk.medilink.appointment.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "appointments")
public class Appointment {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long patientId;

	@Column(nullable = false)
	private Long doctorId;

	@Column(nullable = false)
	private Instant slotTime;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private AppointmentStatus status;

	@Enumerated(EnumType.STRING)
	@Column(nullable = true)
	private AppointmentApproval appoinmentApproval;

	protected Appointment() {
	}

	public Appointment(Long patientId, Long doctorId, Instant slotTime, AppointmentStatus status) {
		this.patientId = patientId;
		this.doctorId = doctorId;
		this.slotTime = slotTime;
		this.status = status;
	}

	public Long getId() {
		return id;
	}

	public Long getPatientId() {
		return patientId;
	}

	public Long getDoctorId() {
		return doctorId;
	}

	public Instant getSlotTime() {
		return slotTime;
	}

	public AppointmentStatus getStatus() {
		return status;
	}

	public AppointmentApproval getAppoinmentApproval() {
		return appoinmentApproval;
	}

	public void setStatus(AppointmentStatus status) {
		this.status = status;
	}

	public void setAppoinmentApproval(AppointmentApproval appoinmentApproval) {
		this.appoinmentApproval = appoinmentApproval;
	}
}

