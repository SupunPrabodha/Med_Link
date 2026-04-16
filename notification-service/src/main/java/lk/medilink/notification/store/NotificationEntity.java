package lk.medilink.notification.store;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
		name = "notifications",
		indexes = {
				@Index(name = "idx_notifications_created_at", columnList = "createdAt"),
				@Index(name = "idx_notifications_user_created_at", columnList = "userId, createdAt")
		}
)
public class NotificationEntity {
	@Id
	@Column(length = 36)
	private String id;

	@Column(nullable = false)
	private Instant createdAt;

	@Column(nullable = false, length = 100)
	private String type;

	@Column(nullable = false, length = 2000)
	private String message;

	@Column(nullable = true)
	private Long userId;

	protected NotificationEntity() {
	}

	public NotificationEntity(String type, String message, Long userId) {
		this.type = type;
		this.message = message;
		this.userId = userId;
	}

	@PrePersist
	void prePersist() {
		if (this.id == null || this.id.isBlank()) {
			this.id = UUID.randomUUID().toString();
		}
		if (this.createdAt == null) {
			this.createdAt = Instant.now();
		}
	}

	public String getId() {
		return id;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public String getType() {
		return type;
	}

	public String getMessage() {
		return message;
	}

	public Long getUserId() {
		return userId;
	}
}
