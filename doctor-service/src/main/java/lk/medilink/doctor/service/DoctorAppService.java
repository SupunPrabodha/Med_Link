package lk.medilink.doctor.service;

import lk.medilink.doctor.domain.DoctorProfile;
import lk.medilink.doctor.domain.VerificationStatus;
import lk.medilink.doctor.messaging.DoctorEvents;
import lk.medilink.doctor.messaging.RabbitConfig;
import lk.medilink.doctor.repo.DoctorProfileRepository;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;

@Service
public class DoctorAppService {
	private final DoctorProfileRepository repo;
	private final RabbitTemplate rabbit;

	public DoctorAppService(DoctorProfileRepository repo, RabbitTemplate rabbit) {
		this.repo = repo;
		this.rabbit = rabbit;
	}

	@Transactional
	public DoctorProfile upsertProfile(Long userId, String fullName, String registrationNo, String specialization, String documentsUrl) {
		DoctorProfile profile = repo.findByUserId(userId)
				.orElseGet(() -> new DoctorProfile(userId, fullName, registrationNo, specialization, documentsUrl));

		profile.setFullName(fullName);
		profile.setRegistrationNo(registrationNo);
		profile.setSpecialization(specialization);
		profile.setDocumentsUrl(documentsUrl);
		if (profile.getStatus() != VerificationStatus.VERIFIED) {
			profile.setStatus(VerificationStatus.PENDING);
			profile.setRejectionReason(null);
		}
		return repo.save(profile);
	}

	public DoctorProfile getOwn(Long userId) {
		return repo.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No profile"));
	}

	public List<DoctorProfile> searchVerified(String specialization) {
		if (specialization == null || specialization.isBlank()) {
			return repo.findByStatus(VerificationStatus.VERIFIED);
		}
		return repo.findByStatusAndSpecializationContainingIgnoreCase(VerificationStatus.VERIFIED, specialization);
	}

	public List<DoctorProfile> pending() {
		return repo.findByStatus(VerificationStatus.PENDING);
	}

	@Transactional
	public DoctorProfile approve(Long doctorId) {
		DoctorProfile p = repo.findById(doctorId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
		p.setStatus(VerificationStatus.VERIFIED);
		p.setRejectionReason(null);
		DoctorProfile saved = repo.save(p);

		rabbit.convertAndSend(RabbitConfig.EXCHANGE, "doctor.verified",
				new DoctorEvents.DoctorVerified(saved.getId(), saved.getUserId(), saved.getSpecialization(), Instant.now()));

		return saved;
	}

	@Transactional
	public DoctorProfile reject(Long doctorId, String reason) {
		DoctorProfile p = repo.findById(doctorId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
		p.setStatus(VerificationStatus.REJECTED);
		p.setRejectionReason(reason);
		DoctorProfile saved = repo.save(p);

		rabbit.convertAndSend(RabbitConfig.EXCHANGE, "doctor.rejected",
				new DoctorEvents.DoctorRejected(saved.getId(), saved.getUserId(), reason, Instant.now()));

		return saved;
	}
}

