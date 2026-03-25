package lk.medilink.gateway;

import lk.medilink.gateway.security.JwtService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
	@Test
	void validate_returnsInvalidForGarbageToken() {
		JwtService jwt = new JwtService("change-me-to-a-long-32bytes-min-secret-change-me");
		assertFalse(jwt.validate("not-a-jwt").valid());
	}
}

