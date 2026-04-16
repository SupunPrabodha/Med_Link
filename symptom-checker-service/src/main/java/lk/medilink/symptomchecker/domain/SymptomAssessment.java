package lk.medilink.symptomchecker.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
		name = "symptom_assessments",
		indexes = {
				@Index(name = "symptom_assessments_user_created_idx", columnList = "userId,createdAt"),
				@Index(name = "symptom_assessments_created_idx", columnList = "createdAt")
		}
)
public class SymptomAssessment {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private Long userId;

	@Column(nullable = false, columnDefinition = "text")
	private String symptoms;

	@Column(nullable = true)
	private Integer age;

	@Column(nullable = true)
	private Integer durationDays;

	@Column(nullable = false)
	private Instant createdAt;

	@Column(nullable = false)
	private String riskLevel;

	@Column(nullable = false, columnDefinition = "text")
	private String summary;

	@Column(nullable = false, columnDefinition = "text")
	private String advice;

	protected SymptomAssessment() {
	}

	public SymptomAssessment(Long userId, String symptoms, Integer age, Integer durationDays, String riskLevel, String summary, String advice) {
		this.userId = userId;
		this.symptoms = symptoms;
		this.age = age;
		this.durationDays = durationDays;
		this.riskLevel = riskLevel;
		this.summary = summary;
		this.advice = advice;
		this.createdAt = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public Long getUserId() {
		return userId;
	}

	public String getSymptoms() {
		return symptoms;
	}

	public Integer getAge() {
		return age;
	}

	public Integer getDurationDays() {
		return durationDays;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public String getRiskLevel() {
		return riskLevel;
	}

	public String getSummary() {
		return summary;
	}

	public String getAdvice() {
		return advice;
	}
}
