package lk.medilink.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Service
public class JwtService {
	private final SecretKey key;

	public JwtService(@Value("${security.jwt.secret}") String secret) {
		this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
	}

	public JwtValidationResult validate(String token) {
		try {
			Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
			return new JwtValidationResult(true, claims);
		} catch (Exception e) {
			return new JwtValidationResult(false, null);
		}
	}

	@SuppressWarnings("unchecked")
	public List<String> extractRoles(Claims claims) {
		if (claims == null) return Collections.emptyList();
		Object roles = claims.get("roles");
		if (roles instanceof List<?> l) {
			return l.stream().filter(Objects::nonNull).map(Object::toString).toList();
		}
		return Collections.emptyList();
	}

	public record JwtValidationResult(boolean valid, Claims claims) {
	}
}

