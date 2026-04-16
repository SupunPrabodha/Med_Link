package lk.medilink.prescription.repo;

import lk.medilink.prescription.domain.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
	List<Prescription> findByPatientUserIdOrderByIssuedAtDesc(Long patientUserId);

	List<Prescription> findByDoctorUserIdOrderByIssuedAtDesc(Long doctorUserId);
}
