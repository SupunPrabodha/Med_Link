package lk.medilink.notification.store;

import java.time.Instant;

public record NotificationItem(
		String id,
		Instant createdAt,
		String type,
		String message,
		Long userId
) {
}
