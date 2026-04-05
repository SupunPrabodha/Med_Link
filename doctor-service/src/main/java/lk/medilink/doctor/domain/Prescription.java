package lk.medilink.doctor.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "prescriptions")
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long doctorId;

    @Column(nullable = false)
    private Long patientId;

    @Column(nullable = false)
    private Long appointmentId;

    @Column(nullable = false, length = 4000)
    private String diagnosis;

    @Column(nullable = false, length = 4000)
    private String medicines;

    @Column(nullable = true, length = 4000)
    private String notes;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    protected Prescription() {
    }

    public Prescription(Long doctorId, Long patientId, Long appointmentId, String diagnosis, String medicines, String notes) {
        this.doctorId = doctorId;
        this.patientId = patientId;
        this.appointmentId = appointmentId;
        this.diagnosis = diagnosis;
        this.medicines = medicines;
        this.notes = notes;
    }

    public Long getId() {
        return id;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public Long getPatientId() {
        return patientId;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public String getDiagnosis() {
        return diagnosis;
    }

    public String getMedicines() {
        return medicines;
    }

    public String getNotes() {
        return notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
