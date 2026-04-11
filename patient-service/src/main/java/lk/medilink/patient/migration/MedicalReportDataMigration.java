package lk.medilink.patient.migration;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class MedicalReportDataMigration implements ApplicationRunner {
	private final JdbcTemplate jdbc;

	public MedicalReportDataMigration(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		// Previous versions stored report bytes as Postgres large objects (oid).
		// Convert to bytea to avoid LOB stream/autocommit issues and to simplify reads.
		String type;
		try {
			type = jdbc.queryForObject(
					"select data_type from information_schema.columns where table_schema = 'public' and table_name = 'medical_reports' and column_name = 'data'",
					String.class
			);
		} catch (Exception e) {
			return;
		}
		if (type == null || !type.equalsIgnoreCase("oid")) {
			return;
		}

		jdbc.execute("alter table medical_reports add column if not exists data_bytes bytea");
		jdbc.execute("update medical_reports set data_bytes = lo_get(data) where data_bytes is null");
		jdbc.execute("alter table medical_reports alter column data_bytes set not null");
		jdbc.execute("alter table medical_reports drop column data");
		jdbc.execute("alter table medical_reports rename column data_bytes to data");
	}
}
