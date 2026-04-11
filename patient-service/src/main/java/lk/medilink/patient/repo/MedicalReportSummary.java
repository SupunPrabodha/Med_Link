package lk.medilink.patient.repo;

import java.time.Instant;

public interface MedicalReportSummary {
	Long getId();

	String getFileName();

	String getContentType();

	long getSizeBytes();

	String getDescription();

	Instant getUploadedAt();
}
