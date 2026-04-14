package lk.medilink.appointment.web.dto;

import jakarta.validation.constraints.NotNull;
import lk.medilink.appointment.domain.AppointmentApproval;

public record UpdateAppointmentApprovalRequest(
		@NotNull AppointmentApproval appoinmentApproval
) {
}
