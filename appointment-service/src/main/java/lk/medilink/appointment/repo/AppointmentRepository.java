package lk.medilink.appointment.repo;

import lk.medilink.appointment.domain.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
	List<Appointment> findByPatientId(Long patientId);
}

