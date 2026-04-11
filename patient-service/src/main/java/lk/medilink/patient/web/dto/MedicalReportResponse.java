package lk.medilink.patient.web.dto;

import lk.medilink.patient.domain.MedicalReport;
import lk.medilink.patient.repo.MedicalReportSummary;

import java.time.Instant;

public record MedicalReportResponse(
		Long id,
		String fileName,
		String contentType,
		long sizeBytes,
		String description,
		Instant uploadedAt
) {
	public static MedicalReportResponse from(MedicalReport r) {
		return new MedicalReportResponse(r.getId(), r.getFileName(), r.getContentType(), r.getSizeBytes(), r.getDescription(), r.getUploadedAt());
	}

	public static MedicalReportResponse fromSummary(MedicalReportSummary r) {
		return new MedicalReportResponse(r.getId(), r.getFileName(), r.getContentType(), r.getSizeBytes(), r.getDescription(), r.getUploadedAt());
	}
}
