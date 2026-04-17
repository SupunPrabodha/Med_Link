package lk.medilink.prescription.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "prescriptions")
public class Prescription {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long doctorUserId;

	@Column(nullable = false)
	private Long patientUserId;

	@Column(nullable = true)
	private Long appointmentId;

	@Column(nullable = true, columnDefinition = "text")
	private String diagnosis;

	@Column(nullable = false, columnDefinition = "text")
	private String medications;

	@Column(nullable = true, columnDefinition = "text")
	private String notes;

	@Column(nullable = false)
	private Instant issuedAt;

	protected Prescription() {
	}

	public Prescription(Long doctorUserId, Long patientUserId, Long appointmentId, String diagnosis, String medications, String notes) {
		this.doctorUserId = doctorUserId;
		this.patientUserId = patientUserId;
		this.appointmentId = appointmentId;
		this.diagnosis = diagnosis;
		this.medications = medications;
		this.notes = notes;
		this.issuedAt = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public Long getDoctorUserId() {
		return doctorUserId;
	}

	public Long getPatientUserId() {
		return patientUserId;
	}

	public Long getAppointmentId() {
		return appointmentId;
	}

	public String getDiagnosis() {
		return diagnosis;
	}

	public String getMedications() {
		return medications;
	}

	public String getNotes() {
		return notes;
	}

	public Instant getIssuedAt() {
		return issuedAt;
	}
}
