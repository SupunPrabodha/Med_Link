package lk.medilink.auth.web;

import lk.medilink.auth.domain.UserAccount;
import lk.medilink.auth.domain.UserRole;
import lk.medilink.auth.repo.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUsersController {
	private final UserAccountRepository users;

	public AdminUsersController(UserAccountRepository users) {
		this.users = users;
	}

	@GetMapping
	public List<UserSummary> list(@RequestHeader(value = "X-User-Role", required = false) String roles,
	                             @RequestParam(value = "q", required = false) String query) {
		requireAdmin(roles);
		String q = query == null ? "" : query.trim();

		List<UserAccount> rows = q.isEmpty() ? users.findAll() : users.findByEmailContainingIgnoreCase(q);
		return rows.stream().map(u -> new UserSummary(u.getId(), u.getEmail(), u.getRole())).toList();
	}

	private void requireAdmin(String roles) {
		if (roles == null || !roles.contains(UserRole.ADMIN.name())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin role required");
		}
	}

	public record UserSummary(Long id, String email, UserRole role) {
	}
}
