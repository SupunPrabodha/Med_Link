package lk.medilink.telemedicine.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class TelemedicineSchemaFixes {
	private static final Logger log = LoggerFactory.getLogger(TelemedicineSchemaFixes.class);

	@Bean
	ApplicationRunner telemedicineSchemaFixRunner(JdbcTemplate jdbc) {
		return args -> {
			// Hibernate DDL auto-update does not reliably update Postgres CHECK constraints created
			// for @Enumerated columns. If the enum values change, older constraints may block updates.
			//
			// This fix ensures the status constraint includes the current SessionStatus values.
			try {
				jdbc.execute("ALTER TABLE telemedicine_sessions DROP CONSTRAINT IF EXISTS telemedicine_sessions_status_check");
			} catch (Exception e) {
				log.warn("[SCHEMA] Could not drop telemedicine_sessions_status_check (continuing): {}", e.getMessage());
			}

			try {
				jdbc.execute("ALTER TABLE telemedicine_sessions " +
						"ADD CONSTRAINT telemedicine_sessions_status_check " +
						"CHECK (status in ('ACTIVE','COMPLETED','CANCELLED'))");
				log.info("[SCHEMA] Ensured telemedicine_sessions_status_check includes ACTIVE/COMPLETED/CANCELLED");
			} catch (Exception e) {
				// Likely already exists or table not yet created; safe to ignore.
				log.warn("[SCHEMA] Could not add telemedicine_sessions_status_check (continuing): {}", e.getMessage());
			}
		};
	}
}
