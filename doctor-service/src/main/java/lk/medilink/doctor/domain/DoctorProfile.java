package lk.medilink.doctor.domain;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "doctor_profiles")
public class DoctorProfile {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private Long userId;

	@Column(nullable = false)
	private String fullName;

	@Column(nullable = true)
	private String phone;

	@Column(nullable = false)
	private String registrationNo;

	@Column(nullable = false)
	private String specialization;

	@Column(nullable = true)
	private String documentsUrl;

	@Column(nullable = true, length = 1000)
	private String bio;

	@Column(nullable = true)
	private Integer yearsOfExperience;

	@Column(nullable = true)
	private Integer consultationFeeLkr;

	@Column(nullable = true, length = 500)
	private String clinicAddress;

	@Column(nullable = true)
	private String profilePhotoUrl;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private VerificationStatus status;

	@Column(nullable = false)
	private Instant updatedAt;

	@Column(nullable = true)
	private String rejectionReason;

	protected DoctorProfile() {
	}

	public DoctorProfile(Long userId, String fullName, String registrationNo, String specialization, String documentsUrl) {
		this.userId = userId;
		this.fullName = fullName;
		this.registrationNo = registrationNo;
		this.specialization = specialization;
		this.documentsUrl = documentsUrl;
		this.status = VerificationStatus.PENDING;
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

	public String getRegistrationNo() {
		return registrationNo;
	}

	public void setRegistrationNo(String registrationNo) {
		this.registrationNo = registrationNo;
		this.updatedAt = Instant.now();
	}

	public String getSpecialization() {
		return specialization;
	}

	public void setSpecialization(String specialization) {
		this.specialization = specialization;
		this.updatedAt = Instant.now();
	}

	public String getDocumentsUrl() {
		return documentsUrl;
	}

	public void setDocumentsUrl(String documentsUrl) {
		this.documentsUrl = documentsUrl;
		this.updatedAt = Instant.now();
	}

	public String getBio() {
		return bio;
	}

	public void setBio(String bio) {
		this.bio = bio;
		this.updatedAt = Instant.now();
	}

	public Integer getYearsOfExperience() {
		return yearsOfExperience;
	}

	public void setYearsOfExperience(Integer yearsOfExperience) {
		this.yearsOfExperience = yearsOfExperience;
		this.updatedAt = Instant.now();
	}

	public Integer getConsultationFeeLkr() {
		return consultationFeeLkr;
	}

	public void setConsultationFeeLkr(Integer consultationFeeLkr) {
		this.consultationFeeLkr = consultationFeeLkr;
		this.updatedAt = Instant.now();
	}

	public String getClinicAddress() {
		return clinicAddress;
	}

	public void setClinicAddress(String clinicAddress) {
		this.clinicAddress = clinicAddress;
		this.updatedAt = Instant.now();
	}

	public String getProfilePhotoUrl() {
		return profilePhotoUrl;
	}

	public void setProfilePhotoUrl(String profilePhotoUrl) {
		this.profilePhotoUrl = profilePhotoUrl;
		this.updatedAt = Instant.now();
	}

	public VerificationStatus getStatus() {
		return status;
	}

	public void setStatus(VerificationStatus status) {
		this.status = status;
		this.updatedAt = Instant.now();
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public String getRejectionReason() {
		return rejectionReason;
	}

	public void setRejectionReason(String rejectionReason) {
		this.rejectionReason = rejectionReason;
		this.updatedAt = Instant.now();
	}
}

