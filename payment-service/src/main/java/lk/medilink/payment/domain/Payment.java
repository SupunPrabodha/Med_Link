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
}
