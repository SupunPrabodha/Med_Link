package lk.medilink.auth.web;

import lk.medilink.auth.domain.UserAccount;
import lk.medilink.auth.repo.UserAccountRepository;
import lk.medilink.auth.security.JwtService;
import lk.medilink.auth.web.dto.LoginRequest;
import lk.medilink.auth.web.dto.RegisterRequest;
import lk.medilink.auth.web.dto.TokenResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	private final UserAccountRepository users;
	private final PasswordEncoder encoder = new BCryptPasswordEncoder();
	private final JwtService jwt;

	public AuthController(UserAccountRepository users, JwtService jwt) {
		this.users = users;
		this.jwt = jwt;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public TokenResponse register(@Validated @RequestBody RegisterRequest req) {
		if (users.existsByEmail(req.email())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
		}
		UserAccount created = users.save(new UserAccount(req.email(), encoder.encode(req.password()), req.role()));
		return TokenResponse.bearer(jwt.issue(created));
	}

	@PostMapping("/login")
	public TokenResponse login(@Validated @RequestBody LoginRequest req) {
		UserAccount user = users.findByEmail(req.email())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
		if (!encoder.matches(req.password(), user.getPasswordHash())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
		}
		return TokenResponse.bearer(jwt.issue(user));
	}
}

