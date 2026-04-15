package lk.medilink.telemedicine.repo;

import lk.medilink.telemedicine.domain.ConsultationAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConsultationAuditLogRepository extends JpaRepository<ConsultationAuditLog, Long> {
	List<ConsultationAuditLog> findBySessionIdOrderByOccurredAtAsc(Long sessionId);
}
