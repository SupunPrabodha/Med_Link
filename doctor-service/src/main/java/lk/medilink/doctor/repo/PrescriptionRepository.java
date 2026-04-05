package lk.medilink.doctor.repo;

import lk.medilink.doctor.domain.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByDoctorId(Long doctorId);
    List<Prescription> findByPatientId(Long patientId);
    List<Prescription> findByAppointmentId(Long appointmentId);
}
