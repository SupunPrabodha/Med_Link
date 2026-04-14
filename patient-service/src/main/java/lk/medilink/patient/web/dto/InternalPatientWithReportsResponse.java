package lk.medilink.patient.web.dto;

import java.util.List;

public record InternalPatientWithReportsResponse(
		Long userId,
		String fullName,
		String phone,
		List<MedicalReportResponse> reports
) {
}
