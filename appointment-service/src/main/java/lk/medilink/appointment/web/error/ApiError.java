package lk.medilink.appointment.web.error;

import java.util.List;

public record ApiError(
		String message,
		List<Violation> violations
) {
	public record Violation(String field, String message) {
	}
}
