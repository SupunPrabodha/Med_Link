package lk.medilink.gateway.security;

import io.jsonwebtoken.Claims;
import lk.medilink.gateway.security.JwtService.JwtValidationResult;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
public class JwtAuthGatewayFilter extends AbstractGatewayFilterFactory<JwtAuthGatewayFilter.Config> {
	private final JwtService jwtService;

	public JwtAuthGatewayFilter(JwtService jwtService) {
		super(Config.class);
		this.jwtService = jwtService;
	}

	@Override
	public GatewayFilter apply(Config config) {
		return (exchange, chain) -> {
			String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
			if (authHeader == null || !authHeader.startsWith("Bearer ")) {
				return unauthorized(exchange, "Missing Bearer token");
			}

			JwtValidationResult result = jwtService.validate(authHeader.substring(7));
			if (!result.valid()) {
				return unauthorized(exchange, "Invalid token");
			}

			Claims claims = result.claims();
			List<String> roles = jwtService.extractRoles(claims);
			if (config.requiredRoles != null && !config.requiredRoles.isEmpty()) {
				boolean ok = roles.stream().anyMatch(r -> config.requiredRoles.contains(r));
				if (!ok) {
					return forbidden(exchange, "Insufficient role");
				}
			}

			ServerWebExchange mutated = exchange.mutate()
					.request(r -> r.headers(h -> {
						h.add("X-User-Id", String.valueOf(claims.get("uid")));
						h.add("X-User-Role", String.join(",", roles));
					}))
					.build();

			return chain.filter(mutated);
		};
	}

	private Mono<Void> unauthorized(ServerWebExchange exchange, String msg) {
		exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
		exchange.getResponse().getHeaders().add("X-Error", msg);
		return exchange.getResponse().setComplete();
	}

	private Mono<Void> forbidden(ServerWebExchange exchange, String msg) {
		exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
		exchange.getResponse().getHeaders().add("X-Error", msg);
		return exchange.getResponse().setComplete();
	}

	public static class Config {
		private List<String> requiredRoles;

		public List<String> getRequiredRoles() {
			return requiredRoles;
		}

		public void setRequiredRoles(List<String> requiredRoles) {
			this.requiredRoles = requiredRoles;
		}
	}
}

