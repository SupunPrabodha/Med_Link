package lk.medilink.telemedicine.repo;

import lk.medilink.telemedicine.domain.TelemedicineSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TelemedicineSessionRepository extends JpaRepository<TelemedicineSession, Long> {
	Optional<TelemedicineSession> findByAppointmentId(Long appointmentId);
}
