package lk.medilink.auth;

import lk.medilink.auth.domain.UserAccount;
import lk.medilink.auth.domain.UserRole;
import lk.medilink.auth.security.JwtService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
	@Test
	void issuesNonEmptyToken() {
		JwtService jwt = new JwtService("change-me-to-a-long-32bytes-min-secret-change-me", 3600);
		UserAccount u = new UserAccount("a@b.com", "x", UserRole.PATIENT);
		String token = jwt.issue(u);
		assertNotNull(token);
		assertFalse(token.isBlank());
		assertTrue(token.split("\\.").length >= 3);
	}
}

