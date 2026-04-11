package lk.medilink.patient.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "medical_reports")
public class MedicalReport {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long userId;

	@Column(nullable = false)
	private String fileName;

	@Column(nullable = false)
	private String contentType;

	@Column(nullable = false)
	private long sizeBytes;

	@Column(nullable = true)
	private String description;

	@Column(nullable = false)
	private Instant uploadedAt;

	@Column(nullable = false, columnDefinition = "bytea")
	private byte[] data;

	protected MedicalReport() {
	}

	public MedicalReport(Long userId, String fileName, String contentType, long sizeBytes, String description, byte[] data) {
		this.userId = userId;
		this.fileName = fileName;
		this.contentType = contentType;
		this.sizeBytes = sizeBytes;
		this.description = description;
		this.data = data;
		this.uploadedAt = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public Long getUserId() {
		return userId;
	}

	public String getFileName() {
		return fileName;
	}

	public String getContentType() {
		return contentType;
	}

	public long getSizeBytes() {
		return sizeBytes;
	}

	public String getDescription() {
		return description;
	}

	public Instant getUploadedAt() {
		return uploadedAt;
	}

	public byte[] getData() {
		return data;
	}
}
