package lk.medilink.telemedicine.service;

import lk.medilink.telemedicine.domain.ConsultationAuditAction;
import lk.medilink.telemedicine.domain.ConsultationAuditLog;
import lk.medilink.telemedicine.repo.ConsultationAuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConsultationAuditService {

	private final ConsultationAuditLogRepository auditLogs;

	public ConsultationAuditService(ConsultationAuditLogRepository auditLogs) {
		this.auditLogs = auditLogs;
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public ConsultationAuditLog recordSystemAction(Long sessionId, ConsultationAuditAction action, String details) {
		return auditLogs.save(new ConsultationAuditLog(sessionId, 0L, action, details));
	}

	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public ConsultationAuditLog recordUserAction(Long sessionId, Long actorUserId, ConsultationAuditAction action, String details) {
		return auditLogs.save(new ConsultationAuditLog(sessionId, actorUserId, action, details));
	}
}