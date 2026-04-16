package lk.medilink.auth.web;

import lk.medilink.auth.domain.UserAccount;
import lk.medilink.auth.repo.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
@RequestMapping("/internal/users")
public class InternalUsersController {
	private final UserAccountRepository users;
	private final String internalToken;

	public InternalUsersController(UserAccountRepository users,
	                              @Value("${app.internal-token:}") String internalToken) {
		this.users = users;
		this.internalToken = internalToken == null ? "" : internalToken;
	}

	@GetMapping("/{id}")
	public UserContact get(@RequestHeader(value = "X-Internal-Token", required = false) String token,
	                       @PathVariable("id") Long id) {
		requireInternalToken(token);
		if (id == null || id <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid user id");
		}
		UserAccount u = users.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
		return new UserContact(u.getId(), u.getEmail(), u.getRole().name());
	}

	private void requireInternalToken(String token) {
		if (internalToken.isBlank()) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Internal API is not configured");
		}
		String provided = token == null ? "" : token;
		boolean ok = MessageDigest.isEqual(
				internalToken.getBytes(StandardCharsets.UTF_8),
				provided.getBytes(StandardCharsets.UTF_8)
		);
		if (!ok) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
		}
	}

	public record UserContact(Long userId, String email, String role) {
	}
}
