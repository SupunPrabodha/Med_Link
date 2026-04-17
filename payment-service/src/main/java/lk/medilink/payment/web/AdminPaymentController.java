package lk.medilink.payment.web;

import lk.medilink.payment.domain.Payment;
import lk.medilink.payment.domain.PaymentStatus;
import lk.medilink.payment.service.PaymentAppService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/payments")
public class AdminPaymentController {
	private final PaymentAppService service;

	public AdminPaymentController(PaymentAppService service) {
		this.service = service;
	}

	@GetMapping
	public List<Payment> all(@RequestParam(value = "patientId", required = false) Long patientId,
	                        @RequestParam(value = "appointmentId", required = false) Long appointmentId,
	                        @RequestParam(value = "status", required = false) PaymentStatus status) {
		return service.listAll().stream()
				.filter(p -> patientId == null || patientId.equals(p.getPatientId()))
				.filter(p -> appointmentId == null || appointmentId.equals(p.getAppointmentId()))
				.filter(p -> status == null || status == p.getStatus())
				.toList();
	}

	public record AdminNoteRequest(String note) {
	}

	@PostMapping("/{paymentId}/review")
	public Payment review(@RequestHeader("X-User-Id") Long adminUserId,
	                      @PathVariable("paymentId") Long paymentId,
	                      @RequestBody(required = false) AdminNoteRequest req) {
		return service.reviewPayment(paymentId, adminUserId, req == null ? null : req.note());
	}

	@PostMapping("/{paymentId}/dispute")
	public Payment dispute(@RequestHeader("X-User-Id") Long adminUserId,
	                       @PathVariable("paymentId") Long paymentId,
	                       @RequestBody(required = false) AdminNoteRequest req) {
		return service.flagPaymentDispute(paymentId, adminUserId, req == null ? null : req.note());
	}

	@PostMapping("/{paymentId}/refund")
	public Payment refund(@RequestHeader("X-User-Id") Long adminUserId,
	                      @PathVariable("paymentId") Long paymentId,
	                      @RequestBody(required = false) AdminNoteRequest req) {
		return service.refundPayment(paymentId, adminUserId, req == null ? null : req.note());
	}
}
