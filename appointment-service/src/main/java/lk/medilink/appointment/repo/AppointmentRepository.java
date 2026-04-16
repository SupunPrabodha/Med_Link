package lk.medilink.appointment.repo;

import lk.medilink.appointment.domain.Appointment;
import lk.medilink.appointment.domain.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
	List<Appointment> findByPatientId(Long patientId);

	List<Appointment> findByDoctorIdOrderBySlotTimeAsc(Long doctorId);

	List<Appointment> findByDoctorIdAndStatusOrderBySlotTimeAsc(Long doctorId, AppointmentStatus status);

	boolean existsByDoctorIdAndPatientIdAndStatus(Long doctorId, Long patientId, AppointmentStatus status);

	boolean existsByDoctorIdAndSlotTimeAndStatusNot(Long doctorId, Instant slotTime, AppointmentStatus status);

	boolean existsByDoctorIdAndSlotTimeAndStatusNotAndIdNot(Long doctorId, Instant slotTime, AppointmentStatus status, Long id);

	List<Appointment> findByDoctorIdAndSlotTimeBetween(Long doctorId, Instant from, Instant to);
}

