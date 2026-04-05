package lk.medilink.doctor.service;

import lk.medilink.doctor.domain.DoctorAvailability;
import lk.medilink.doctor.domain.DoctorProfile;
import lk.medilink.doctor.domain.Prescription;
import lk.medilink.doctor.domain.VerificationStatus;
import lk.medilink.doctor.messaging.DoctorEvents;
import lk.medilink.doctor.messaging.RabbitConfig;
import lk.medilink.doctor.repo.DoctorAvailabilityRepository;
import lk.medilink.doctor.repo.DoctorProfileRepository;
import lk.medilink.doctor.repo.PrescriptionRepository;
import lk.medilink.doctor.web.dto.CreateAvailabilityRequest;
import lk.medilink.doctor.web.dto.CreatePrescriptionRequest;
import lk.medilink.doctor.web.dto.DecisionRequest;
import lk.medilink.doctor.web.dto.UpdateAvailabilityRequest;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.Instant;
import java.util.List;

@Service
public class DoctorAppService {

	private final DoctorProfileRepository repo;
	private final DoctorAvailabilityRepository availabilityRepository;
	private final PrescriptionRepository prescriptionRepository;
	private final RabbitTemplate rabbit;

	public DoctorAppService(DoctorProfileRepository repo,
	                        DoctorAvailabilityRepository availabilityRepository,
	                        PrescriptionRepository prescriptionRepository,
	                        RabbitTemplate rabbit) {
		this.repo = repo;
		this.availabilityRepository = availabilityRepository;
		this.prescriptionRepository = prescriptionRepository;
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

	@Transactional
	public DoctorAvailability addAvailability(Long doctorId, CreateAvailabilityRequest req) {
		DoctorProfile profile = repo.findByUserId(doctorId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor profile not found"));

		if (profile.getStatus() != VerificationStatus.VERIFIED) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only verified doctors can set availability");
		}

		if (req.endTime().isBefore(req.startTime()) || req.endTime().equals(req.startTime())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
		}

		DoctorAvailability slot = new DoctorAvailability(doctorId, req.dayOfWeek(), req.startTime(), req.endTime());
		return availabilityRepository.save(slot);
	}

	public List<DoctorAvailability> myAvailability(Long doctorId) {
		return availabilityRepository.findByDoctorIdAndActiveTrue(doctorId);
	}

	public List<DoctorAvailability> myAvailabilityByDay(Long doctorId, DayOfWeek dayOfWeek) {
		return availabilityRepository.findByDoctorIdAndDayOfWeekAndActiveTrue(doctorId, dayOfWeek);
	}

	@Transactional
	public DoctorAvailability updateAvailability(Long doctorId, Long availabilityId, UpdateAvailabilityRequest req) {
		DoctorAvailability slot = availabilityRepository.findById(availabilityId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Availability not found"));

		if (!slot.getDoctorId().equals(doctorId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your availability slot");
		}

		if (req.endTime().isBefore(req.startTime()) || req.endTime().equals(req.startTime())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "End time must be after start time");
		}

		slot.setStartTime(req.startTime());
		slot.setEndTime(req.endTime());
		slot.setActive(req.active());
		return availabilityRepository.save(slot);
	}

	@Transactional
	public void deleteAvailability(Long doctorId, Long availabilityId) {
		DoctorAvailability slot = availabilityRepository.findById(availabilityId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Availability not found"));

		if (!slot.getDoctorId().equals(doctorId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your availability slot");
		}

		availabilityRepository.delete(slot);
	}

	public String acceptAppointment(Long doctorId, Long appointmentId, DecisionRequest req) {
		String reason = req == null ? null : req.reason();
		return "Appointment " + appointmentId + " accepted by doctor " + doctorId +
				(reason != null && !reason.isBlank() ? " | note: " + reason : "");
	}

	public String rejectAppointment(Long doctorId, Long appointmentId, DecisionRequest req) {
		String reason = req == null ? null : req.reason();
		return "Appointment " + appointmentId + " rejected by doctor " + doctorId +
				(reason != null && !reason.isBlank() ? " | reason: " + reason : "");
	}

	@Transactional
	public Prescription issuePrescription(Long doctorId, CreatePrescriptionRequest req) {
		DoctorProfile profile = repo.findByUserId(doctorId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor profile not found"));

		if (profile.getStatus() != VerificationStatus.VERIFIED) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only verified doctors can issue prescriptions");
		}

		Prescription p = new Prescription(
				doctorId,
				req.patientId(),
				req.appointmentId(),
				req.diagnosis(),
				req.medicines(),
				req.notes()
		);
		return prescriptionRepository.save(p);
	}

	public List<Prescription> myPrescriptions(Long doctorId) {
		return prescriptionRepository.findByDoctorId(doctorId);
	}

	public String viewPatientReport(Long doctorId, Long patientId, Long appointmentId) {
		return "Doctor " + doctorId + " viewing patient " + patientId + " report for appointment " + appointmentId;
	}

	public String joinTelemedicineSession(Long doctorId, Long appointmentId) {
		return "Telemedicine session ready for doctor=" + doctorId + ", appointment=" + appointmentId;
	}
}