package lk.medilink.patient.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "patient_profiles")
public class PatientProfile {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private Long userId;

	@Column(nullable = false)
	private String fullName;

	@Column(nullable = false)
	private String phone;

	@Column(nullable = true)
	private LocalDate dateOfBirth;

	@Column(nullable = true)
	private String address;

	@Column(nullable = true)
	private String profilePhotoUrl;

	@Column(nullable = false)
	private Instant updatedAt;

	protected PatientProfile() {
	}

	public PatientProfile(Long userId, String fullName, String phone, LocalDate dateOfBirth, String address) {
		this.userId = userId;
		this.fullName = fullName;
		this.phone = phone;
		this.dateOfBirth = dateOfBirth;
		this.address = address;
		this.updatedAt = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public Long getUserId() {
		return userId;
	}

	public String getFullName() {
		return fullName;
	}

	public void setFullName(String fullName) {
		this.fullName = fullName;
		this.updatedAt = Instant.now();
	}

	public String getPhone() {
		return phone;
	}

	public void setPhone(String phone) {
		this.phone = phone;
		this.updatedAt = Instant.now();
	}

	public LocalDate getDateOfBirth() {
		return dateOfBirth;
	}

	public void setDateOfBirth(LocalDate dateOfBirth) {
		this.dateOfBirth = dateOfBirth;
		this.updatedAt = Instant.now();
	}

	public String getAddress() {
		return address;
	}

	public void setAddress(String address) {
		this.address = address;
		this.updatedAt = Instant.now();
	}

	public String getProfilePhotoUrl() {
		return profilePhotoUrl;
	}

	public void setProfilePhotoUrl(String profilePhotoUrl) {
		this.profilePhotoUrl = profilePhotoUrl;
		this.updatedAt = Instant.now();
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
