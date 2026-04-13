package lk.medilink.doctor.repo;

import lk.medilink.doctor.domain.DoctorAvailabilityBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DoctorAvailabilityBlockRepository extends JpaRepository<DoctorAvailabilityBlock, Long> {
	List<DoctorAvailabilityBlock> findByDoctorId(Long doctorId);

	void deleteByDoctorId(Long doctorId);
}
