package lk.medilink.auth.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lk.medilink.auth.domain.UserAccount;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class JwtService {
	private final SecretKey key;
	private final long ttlSeconds;

	public JwtService(@Value("${security.jwt.secret}") String secret,
	                 @Value("${security.jwt.ttl-seconds:3600}") long ttlSeconds) {
		this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.ttlSeconds = ttlSeconds;
	}

	public String issue(UserAccount user) {
		Instant now = Instant.now();
		return Jwts.builder()
				.id(UUID.randomUUID().toString())
				.issuedAt(java.util.Date.from(now))
				.expiration(java.util.Date.from(now.plusSeconds(ttlSeconds)))
				.claim("uid", user.getId())
				.claim("email", user.getEmail())
				.claim("roles", List.of(user.getRole().name()))
				.signWith(key)
				.compact();
	}
}

