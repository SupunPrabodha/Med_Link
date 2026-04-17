package lk.medilink.notification.store;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class NotificationStore {
	private final NotificationRepository repo;

	public NotificationStore(NotificationRepository repo) {
		this.repo = repo;
	}

	public NotificationItem add(String type, String message, Long userId) {
		NotificationEntity saved = repo.save(new NotificationEntity(type, message, userId));
		return toItem(saved);
	}

	public List<NotificationItem> listForUser(Long userId, int limit) {
		int capped = Math.max(1, Math.min(limit, 200));
		return repo.findByUserIdOrderByCreatedAtDesc(
				userId,
				PageRequest.of(0, capped, Sort.by(Sort.Direction.DESC, "createdAt"))
		).stream().map(NotificationStore::toItem).toList();
	}

	public List<NotificationItem> listAll(int limit) {
		int capped = Math.max(1, Math.min(limit, 500));
		return repo.findAllByOrderByCreatedAtDesc(
				PageRequest.of(0, capped, Sort.by(Sort.Direction.DESC, "createdAt"))
		).stream().map(NotificationStore::toItem).toList();
	}

	private static NotificationItem toItem(NotificationEntity e) {
		return new NotificationItem(e.getId(), e.getCreatedAt(), e.getType(), e.getMessage(), e.getUserId());
	}
}
