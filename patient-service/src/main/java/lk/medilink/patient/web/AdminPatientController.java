package lk.medilink.patient.web;

import lk.medilink.patient.domain.MedicalReport;
import lk.medilink.patient.domain.PatientProfile;
import lk.medilink.patient.repo.MedicalReportSummary;
import lk.medilink.patient.service.PatientAppService;
import lk.medilink.patient.web.dto.MedicalReportResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/patients")
public class AdminPatientController {
	private final PatientAppService service;

	public AdminPatientController(PatientAppService service) {
		this.service = service;
	}

	@GetMapping
	public List<PatientProfile> allProfiles() {
		return service.listAllProfiles();
	}

	@GetMapping("/{userId}/profile")
	public PatientProfile profile(@PathVariable("userId") Long userId) {
		return service.getProfile(userId);
	}

	@GetMapping("/{userId}/reports")
	public List<MedicalReportResponse> reports(@PathVariable("userId") Long userId) {
		List<MedicalReportSummary> rows = service.listReportSummaries(userId);
		return rows.stream().map(MedicalReportResponse::fromSummary).toList();
	}

	@GetMapping("/{userId}/reports/{id}/download")
	public ResponseEntity<byte[]> download(@PathVariable("userId") Long userId,
	                                      @PathVariable("id") Long id) {
		MedicalReport r = service.getReport(userId, id);
		HttpHeaders h = new HttpHeaders();
		h.setContentType(MediaType.parseMediaType(r.getContentType()));
		h.setContentLength(r.getSizeBytes());
		h.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeFileName(r.getFileName()) + "\"");
		return new ResponseEntity<>(r.getData(), h, HttpStatus.OK);
	}

	private static String safeFileName(String name) {
		if (name == null || name.isBlank()) return "report";
		return name.replaceAll("[\\r\\n\\t]", " ").trim();
	}
}
