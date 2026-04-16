package lk.medilink.notification.web;

import lk.medilink.notification.store.NotificationItem;
import lk.medilink.notification.store.NotificationStore;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api")
public class NotificationController {
	private final NotificationStore store;

	public NotificationController(NotificationStore store) {
		this.store = store;
	}

	@GetMapping("/notifications")
	public List<NotificationItem> myNotifications(@RequestHeader("X-User-Id") Long userId,
	                                             @RequestParam(value = "limit", required = false, defaultValue = "50") int limit) {
		return store.listForUser(userId, limit);
	}

	@GetMapping("/admin/notifications")
	public List<NotificationItem> all(@RequestParam(value = "limit", required = false, defaultValue = "200") int limit) {
		return store.listAll(limit);
	}

	@GetMapping("/notifications/ping")
	public String ping() {
		return "notification-service @ " + Instant.now();
	}
}
