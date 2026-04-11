package lk.medilink.patient.repo;

import lk.medilink.patient.domain.MedicalReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MedicalReportRepository extends JpaRepository<MedicalReport, Long> {
	List<MedicalReport> findByUserIdOrderByUploadedAtDesc(Long userId);

	List<MedicalReportSummary> findAllByUserIdOrderByUploadedAtDesc(Long userId);

	Optional<MedicalReport> findByIdAndUserId(Long id, Long userId);
}
