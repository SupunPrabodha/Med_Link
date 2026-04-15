package lk.medilink.patient.web;

import jakarta.validation.Valid;
import lk.medilink.patient.domain.MedicalReport;
import lk.medilink.patient.domain.PatientProfile;
import lk.medilink.patient.service.PatientAppService;
import lk.medilink.patient.web.dto.InternalPatientWithReportsResponse;
import lk.medilink.patient.web.dto.MedicalReportResponse;
import lk.medilink.patient.web.dto.UpsertPatientProfileRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {
	private final PatientAppService service;

	public PatientController(PatientAppService service) {
		this.service = service;
	}

	@GetMapping("/ping")
	public String ping() {
		return "patient-service @ " + Instant.now();
	}

	@GetMapping("/me/profile")
	public PatientProfile myProfile(@RequestHeader("X-User-Id") Long userId) {
		return service.getOwnProfile(userId);
	}

	@PostMapping("/me/profile")
	@ResponseStatus(HttpStatus.CREATED)
	public PatientProfile upsertProfile(@RequestHeader("X-User-Id") Long userId,
	                                  @Valid @RequestBody UpsertPatientProfileRequest req) {
		return service.upsertProfile(userId, req.fullName().trim(), req.phone().trim(), req.dateOfBirth(), trimToNull(req.address()));
	}

	@PostMapping(value = "/me/reports", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseStatus(HttpStatus.CREATED)
	public MedicalReportResponse uploadReport(@RequestHeader("X-User-Id") Long userId,
	                                        @RequestPart("file") MultipartFile file,
	                                        @RequestPart(value = "description", required = false) String description) {
		MedicalReport saved = service.uploadReport(userId, file, description);
		return MedicalReportResponse.from(saved);
	}

	@GetMapping("/me/reports")
	public List<MedicalReportResponse> listReports(@RequestHeader("X-User-Id") Long userId) {
		return service.listReportSummaries(userId).stream().map(MedicalReportResponse::fromSummary).toList();
	}

	@GetMapping("/internal/patients-with-reports")
	public List<InternalPatientWithReportsResponse> internalPatientsWithReports(@RequestParam("userIds") List<Long> userIds) {
		return service.listPatientsWithReportSummaries(userIds);
	}

	@GetMapping("/internal/patients/{userId}/reports/{id}/download")
	public ResponseEntity<byte[]> internalDownload(@PathVariable("userId") Long userId,
	                                             @PathVariable("id") Long id) {
		MedicalReport r = service.getReport(userId, id);
		HttpHeaders h = new HttpHeaders();
		h.setContentType(MediaType.parseMediaType(r.getContentType()));
		h.setContentLength(r.getSizeBytes());
		h.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeFileName(r.getFileName()) + "\"");
		return new ResponseEntity<>(r.getData(), h, HttpStatus.OK);
	}

	@GetMapping("/me/reports/{id}/download")
	public ResponseEntity<byte[]> download(@RequestHeader("X-User-Id") Long userId,
	                                      @PathVariable("id") Long id) {
		MedicalReport r = service.getReport(userId, id);
		HttpHeaders h = new HttpHeaders();
		h.setContentType(MediaType.parseMediaType(r.getContentType()));
		h.setContentLength(r.getSizeBytes());
		h.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeFileName(r.getFileName()) + "\"");
		return new ResponseEntity<>(r.getData(), h, HttpStatus.OK);
	}

	@DeleteMapping("/me/reports/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@RequestHeader("X-User-Id") Long userId,
	                  @PathVariable("id") Long id) {
		service.deleteReport(userId, id);
	}

	private static String trimToNull(String s) {
		if (s == null) return null;
		String t = s.trim();
		return t.isEmpty() ? null : t;
	}

	private static String safeFileName(String name) {
		if (name == null || name.isBlank()) return "report";
		return name.replaceAll("[\\r\\n\\t]", " ").trim();
	}
}
