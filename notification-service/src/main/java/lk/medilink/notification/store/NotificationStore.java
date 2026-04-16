package lk.medilink.notification.store;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.UUID;

@Component
public class NotificationStore {
	private static final int MAX_ITEMS = 500;

	private final Deque<NotificationItem> items = new ArrayDeque<>();

	public NotificationItem add(String type, String message, Long userId) {
		NotificationItem item = new NotificationItem(UUID.randomUUID().toString(), Instant.now(), type, message, userId);
		synchronized (items) {
			items.addFirst(item);
			while (items.size() > MAX_ITEMS) {
				items.removeLast();
			}
		}
		return item;
	}

	public List<NotificationItem> listForUser(Long userId, int limit) {
		int capped = Math.max(1, Math.min(limit, 200));
		synchronized (items) {
			return items.stream()
					.filter(n -> n.userId() != null && n.userId().equals(userId))
					.limit(capped)
					.toList();
		}
	}

	public List<NotificationItem> listAll(int limit) {
		int capped = Math.max(1, Math.min(limit, 500));
		synchronized (items) {
			return items.stream().limit(capped).toList();
		}
	}
}
