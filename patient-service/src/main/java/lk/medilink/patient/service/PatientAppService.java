package lk.medilink.patient.service;

import lk.medilink.patient.domain.MedicalReport;
import lk.medilink.patient.domain.PatientProfile;
import lk.medilink.patient.repo.MedicalReportRepository;
import lk.medilink.patient.repo.MedicalReportSummary;
import lk.medilink.patient.repo.PatientProfileRepository;
import lk.medilink.patient.web.dto.InternalPatientWithReportsResponse;
import lk.medilink.patient.web.dto.MedicalReportResponse;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class PatientAppService {
	private static final long MAX_REPORT_BYTES = 5L * 1024 * 1024;

	private final PatientProfileRepository profiles;
	private final MedicalReportRepository reports;

	public PatientAppService(PatientProfileRepository profiles, MedicalReportRepository reports) {
		this.profiles = profiles;
		this.reports = reports;
	}

	@Transactional
	public PatientProfile upsertProfile(Long userId, String fullName, String phone, LocalDate dateOfBirth, String address) {
		PatientProfile p = profiles.findByUserId(userId)
				.orElseGet(() -> profiles.save(new PatientProfile(userId, fullName, phone, dateOfBirth, address)));
		p.setFullName(fullName);
		p.setPhone(phone);
		p.setDateOfBirth(dateOfBirth);
		p.setAddress(address);
		return profiles.save(p);
	}

	public PatientProfile getOwnProfile(Long userId) {
		return profiles.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
	}

	public List<PatientProfile> listAllProfiles() {
		return profiles.findAll(Sort.by(Sort.Direction.DESC, "updatedAt"));
	}

	public PatientProfile getProfile(Long userId) {
		return profiles.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
	}

	@Transactional
	public MedicalReport uploadReport(Long userId, MultipartFile file, String description) {
		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Report file is required");
		}
		if (file.getSize() > MAX_REPORT_BYTES) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Report must be 5MB or less");
		}
		String fileName = file.getOriginalFilename();
		if (fileName == null || fileName.isBlank()) {
			fileName = "report";
		}
		String contentType = file.getContentType();
		if (contentType == null || contentType.isBlank()) {
			contentType = "application/octet-stream";
		}

		byte[] bytes;
		try {
			bytes = file.getBytes();
		} catch (IOException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read uploaded file");
		}
		MedicalReport r = new MedicalReport(userId, fileName, contentType, file.getSize(), blankToNull(description), bytes);
		return reports.save(r);
	}

	public List<MedicalReport> listReports(Long userId) {
		return reports.findByUserIdOrderByUploadedAtDesc(userId);
	}

	public List<MedicalReportSummary> listReportSummaries(Long userId) {
		return reports.findAllByUserIdOrderByUploadedAtDesc(userId);
	}

	public List<InternalPatientWithReportsResponse> listPatientsWithReportSummaries(List<Long> userIds) {
		if (userIds == null || userIds.isEmpty()) {
			return List.of();
		}

		List<Long> ids = userIds.stream()
				.filter(id -> id != null && id > 0)
				.distinct()
				.toList();
		if (ids.isEmpty()) {
			return List.of();
		}

		Map<Long, PatientProfile> profilesByUserId = new LinkedHashMap<>();
		for (PatientProfile profile : profiles.findByUserIdIn(ids)) {
			profilesByUserId.put(profile.getUserId(), profile);
		}

		return ids.stream()
				.map(userId -> {
					PatientProfile p = profilesByUserId.get(userId);
					String fullName = p != null ? p.getFullName() : null;
					String phone = p != null ? p.getPhone() : null;

					List<MedicalReportResponse> reportRows = reports.findAllByUserIdOrderByUploadedAtDesc(userId).stream()
							.map(MedicalReportResponse::fromSummary)
							.sorted(Comparator.comparing(MedicalReportResponse::uploadedAt).reversed())
							.toList();

					return new InternalPatientWithReportsResponse(userId, fullName, phone, reportRows);
				})
				.toList();
	}

	public MedicalReport getReport(Long userId, Long reportId) {
		return reports.findByIdAndUserId(reportId, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
	}

	@Transactional
	public void deleteReport(Long userId, Long reportId) {
		MedicalReport r = getReport(userId, reportId);
		reports.delete(r);
	}

	private static String blankToNull(String s) {
		if (s == null) return null;
		String t = s.trim();
		return t.isEmpty() ? null : t;
	}
}
