package lk.medilink.doctor.repo;

import lk.medilink.doctor.domain.DoctorProfile;
import lk.medilink.doctor.domain.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DoctorProfileRepository extends JpaRepository<DoctorProfile, Long> {
	Optional<DoctorProfile> findByUserId(Long userId);

	List<DoctorProfile> findByStatus(VerificationStatus status);

	List<DoctorProfile> findByStatusAndSpecializationContainingIgnoreCase(VerificationStatus status, String specialization);
}

