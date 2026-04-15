package lk.medilink.telemedicine.repo;

import lk.medilink.telemedicine.domain.ConsultationSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConsultationSessionRepository extends JpaRepository<ConsultationSession, Long> {
	Optional<ConsultationSession> findByAppointmentId(Long appointmentId);

	List<ConsultationSession> findByDoctorUserIdOrderByScheduledStartTimeDesc(Long doctorUserId);

	List<ConsultationSession> findByPatientUserIdOrderByScheduledStartTimeDesc(Long patientUserId);
}
