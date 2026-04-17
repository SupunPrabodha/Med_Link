package lk.medilink.prescription.service;

import lk.medilink.prescription.domain.Prescription;
import lk.medilink.prescription.repo.PrescriptionRepository;
import lk.medilink.prescription.web.dto.CreatePrescriptionRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PrescriptionAppService {
	private final PrescriptionRepository repo;

	public PrescriptionAppService(PrescriptionRepository repo) {
		this.repo = repo;
	}

	@Transactional
	public Prescription issue(Long doctorUserId, CreatePrescriptionRequest req) {
		if (doctorUserId == null || doctorUserId <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing doctor user id");
		}
		if (req.patientUserId() == null || req.patientUserId() <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "patientUserId is required");
		}
		String medications = req.medications() == null ? "" : req.medications().trim();
		if (medications.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "medications is required");
		}

		Prescription p = new Prescription(
				doctorUserId,
				req.patientUserId(),
				req.appointmentId(),
				blankToNull(req.diagnosis()),
				medications,
				blankToNull(req.notes())
		);
		return repo.save(p);
	}

	public List<Prescription> listForPatient(Long patientUserId) {
		if (patientUserId == null || patientUserId <= 0) return List.of();
		return repo.findByPatientUserIdOrderByIssuedAtDesc(patientUserId);
	}

	public List<Prescription> listForDoctor(Long doctorUserId) {
		if (doctorUserId == null || doctorUserId <= 0) return List.of();
		return repo.findByDoctorUserIdOrderByIssuedAtDesc(doctorUserId);
	}

	public Prescription getForUser(Long id, Long requesterUserId, boolean admin) {
		Prescription p = repo.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prescription not found"));
		if (admin) return p;
		if (requesterUserId != null && requesterUserId > 0) {
			if (requesterUserId.equals(p.getPatientUserId()) || requesterUserId.equals(p.getDoctorUserId())) {
				return p;
			}
		}
		throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not allowed");
	}

	public List<Prescription> listAll() {
		return repo.findAll(Sort.by(Sort.Direction.DESC, "issuedAt"));
	}

	private static String blankToNull(String s) {
		if (s == null) return null;
		String t = s.trim();
		return t.isEmpty() ? null : t;
	}
}
