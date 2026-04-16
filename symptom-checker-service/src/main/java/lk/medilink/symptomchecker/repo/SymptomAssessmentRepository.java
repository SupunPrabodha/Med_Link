package lk.medilink.symptomchecker.repo;

import lk.medilink.symptomchecker.domain.SymptomAssessment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SymptomAssessmentRepository extends JpaRepository<SymptomAssessment, Long> {
	List<SymptomAssessment> findTop20ByUserIdOrderByCreatedAtDesc(Long userId);
	List<SymptomAssessment> findTop100ByOrderByCreatedAtDesc();
}
