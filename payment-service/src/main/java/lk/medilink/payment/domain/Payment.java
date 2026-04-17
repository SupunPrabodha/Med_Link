package lk.medilink.payment.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "payments")
public class Payment {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private String orderId;

	@Column(nullable = false)
	private Long appointmentId;

	@Column(nullable = false)
	private Long patientId;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal amount;

	@Column(nullable = false)
	private String currency;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private PaymentStatus status;

	@Column(nullable = true)
	private String providerRef;

	@Column(nullable = false)
	private Instant createdAt;

	@Column(nullable = false)
	private Instant updatedAt;

	@Column(nullable = true)
	private Instant completedAt;

	@Column(nullable = true)
	private Instant failedAt;

	@Column(nullable = true)
	private Instant reviewedAt;

	@Column(nullable = true)
	private Long reviewedByAdminUserId;

	@Column(nullable = true, length = 1000)
	private String reviewNote;

	@Column(nullable = true)
	private Instant disputedAt;

	@Column(nullable = true)
	private Long disputedByAdminUserId;

	@Column(nullable = true, length = 1000)
	private String disputeNote;

	@Column(nullable = true)
	private Instant refundedAt;

	@Column(nullable = true)
	private Long refundedByAdminUserId;

	@Column(nullable = true, length = 1000)
	private String refundNote;

	protected Payment() {
	}

	public Payment(String orderId, Long appointmentId, Long patientId, BigDecimal amount, String currency) {
		this.orderId = orderId;
		this.appointmentId = appointmentId;
		this.patientId = patientId;
		this.amount = amount;
		this.currency = currency;
		this.status = PaymentStatus.PENDING;
		this.createdAt = Instant.now();
		this.updatedAt = this.createdAt;
	}

	public Long getId() {
		return id;
	}

	public String getOrderId() {
		return orderId;
	}

	public Long getAppointmentId() {
		return appointmentId;
	}

	public Long getPatientId() {
		return patientId;
	}

	public BigDecimal getAmount() {
		return amount;
	}

	public String getCurrency() {
		return currency;
	}

	public PaymentStatus getStatus() {
		return status;
	}

	public String getProviderRef() {
		return providerRef;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public Instant getCompletedAt() {
		return completedAt;
	}

	public Instant getFailedAt() {
		return failedAt;
	}

	public Instant getReviewedAt() {
		return reviewedAt;
	}

	public Long getReviewedByAdminUserId() {
		return reviewedByAdminUserId;
	}

	public String getReviewNote() {
		return reviewNote;
	}

	public Instant getDisputedAt() {
		return disputedAt;
	}

	public Long getDisputedByAdminUserId() {
		return disputedByAdminUserId;
	}

	public String getDisputeNote() {
		return disputeNote;
	}

	public Instant getRefundedAt() {
		return refundedAt;
	}

	public Long getRefundedByAdminUserId() {
		return refundedByAdminUserId;
	}

	public String getRefundNote() {
		return refundNote;
	}

	public void markCompleted(String providerRef, Instant paidAt) {
		this.status = PaymentStatus.COMPLETED;
		this.providerRef = providerRef;
		this.completedAt = paidAt;
		this.updatedAt = Instant.now();
	}

	public void markFailed(String providerRef, Instant failedAt) {
		this.status = PaymentStatus.FAILED;
		this.providerRef = providerRef;
		this.failedAt = failedAt;
		this.updatedAt = Instant.now();
	}

	public void markReviewed(Long adminUserId, String note) {
		this.reviewedAt = Instant.now();
		this.reviewedByAdminUserId = adminUserId;
		this.reviewNote = note;
		this.updatedAt = Instant.now();
	}

	public void markDisputed(Long adminUserId, String note) {
		this.disputedAt = Instant.now();
		this.disputedByAdminUserId = adminUserId;
		this.disputeNote = note;
		this.updatedAt = Instant.now();
	}

	public void markRefunded(Long adminUserId, String note) {
		this.refundedAt = Instant.now();
		this.refundedByAdminUserId = adminUserId;
		this.refundNote = note;
		this.updatedAt = Instant.now();
	}
}
