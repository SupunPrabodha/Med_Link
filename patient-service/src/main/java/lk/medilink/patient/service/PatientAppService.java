package lk.medilink.patient.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lk.medilink.patient.domain.MedicalReport;
import lk.medilink.patient.domain.PatientProfile;
import lk.medilink.patient.repo.MedicalReportRepository;
import lk.medilink.patient.repo.MedicalReportSummary;
import lk.medilink.patient.repo.PatientProfileRepository;
import lk.medilink.patient.web.dto.InternalPatientWithReportsResponse;
import lk.medilink.patient.web.dto.MedicalReportResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class PatientAppService {
	private static final long MAX_REPORT_BYTES = 5L * 1024 * 1024;
	private static final long MAX_PHOTO_BYTES = 2L * 1024 * 1024;
	private static final Set<String> ALLOWED_PHOTO_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

	private final PatientProfileRepository profiles;
	private final MedicalReportRepository reports;
	private final Cloudinary cloudinary;

	public PatientAppService(PatientProfileRepository profiles,
	                         MedicalReportRepository reports,
	                         @Value("${app.cloudinary-url:}") String cloudinaryUrl) {
		this.profiles = profiles;
		this.reports = reports;
		this.cloudinary = cloudinaryUrl == null || cloudinaryUrl.isBlank() ? null : new Cloudinary(cloudinaryUrl.trim());
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
	public PatientProfile uploadProfilePhoto(Long userId, MultipartFile file) {
		if (cloudinary == null) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Image storage is not configured");
		}
		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Photo file is required");
		}
		if (file.getSize() > MAX_PHOTO_BYTES) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Photo must be 2MB or less");
		}

		String contentType = file.getContentType();
		if (contentType == null || contentType.isBlank() || !ALLOWED_PHOTO_CONTENT_TYPES.contains(contentType)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG or WebP images are allowed");
		}

		byte[] bytes;
		try {
			bytes = file.getBytes();
		} catch (IOException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read uploaded file");
		}

		try {
			if (ImageIO.read(new ByteArrayInputStream(bytes)) == null) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid image file");
			}
		} catch (IOException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid image file");
		}

		Map<?, ?> res;
		try {
			res = cloudinary.uploader().upload(bytes, ObjectUtils.asMap(
					"folder", "medilink/patient/profile-photos",
					"public_id", "user-" + userId,
					"overwrite", true,
					"resource_type", "image",
					"transformation", "c_fill,w_256,h_256"
			));
		} catch (Exception e) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to upload image");
		}

		String url = res == null ? null : (String) res.get("secure_url");
		if (url == null || url.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Image upload did not return a URL");
		}

		PatientProfile p = profiles.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
		p.setProfilePhotoUrl(url);
		return profiles.save(p);
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
