package lk.medilink.doctor.service;

import lk.medilink.doctor.domain.DoctorAvailabilityBlock;
import lk.medilink.doctor.domain.DoctorProfile;
import lk.medilink.doctor.domain.VerificationStatus;
import lk.medilink.doctor.messaging.DoctorEvents;
import lk.medilink.doctor.messaging.RabbitConfig;
import lk.medilink.doctor.repo.DoctorAvailabilityBlockRepository;
import lk.medilink.doctor.repo.DoctorProfileRepository;
import lk.medilink.doctor.web.dto.UpsertDoctorAvailabilityRequest;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.*;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class DoctorAppService {
	private static final int SLOT_MINUTES = 30;
	private static final ZoneId AVAILABILITY_ZONE = ZoneId.of("Asia/Colombo");
	private static final int MAX_AVAILABILITY_BLOCKS = 50;
	private static final int MAX_SLOTS_RESPONSE = 1000;

	private final DoctorProfileRepository repo;
	private final DoctorAvailabilityBlockRepository availabilityRepo;
	private final RabbitTemplate rabbit;

	public DoctorAppService(DoctorProfileRepository repo,
	                        DoctorAvailabilityBlockRepository availabilityRepo,
	                        RabbitTemplate rabbit) {
		this.repo = repo;
		this.availabilityRepo = availabilityRepo;
		this.rabbit = rabbit;
	}

	@Transactional
	public DoctorProfile upsertProfile(Long userId, String fullName, String registrationNo, String specialization, String documentsUrl) {
		DoctorProfile profile = repo.findByUserId(userId)
				.orElseGet(() -> new DoctorProfile(userId, fullName, registrationNo, specialization, documentsUrl));

		profile.setFullName(fullName);
		profile.setRegistrationNo(registrationNo);
		profile.setSpecialization(specialization);
		profile.setDocumentsUrl(documentsUrl);
		if (profile.getStatus() != VerificationStatus.VERIFIED) {
			profile.setStatus(VerificationStatus.PENDING);
			profile.setRejectionReason(null);
		}
		return repo.save(profile);
	}

	public DoctorProfile getOwn(Long userId) {
		return repo.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No profile"));
	}

	public List<DoctorProfile> searchVerified(String specialization) {
		if (specialization == null || specialization.isBlank()) {
			return repo.findByStatus(VerificationStatus.VERIFIED);
		}
		return repo.findByStatusAndSpecializationContainingIgnoreCase(VerificationStatus.VERIFIED, specialization);
	}

	public List<DoctorProfile> pending() {
		return repo.findByStatus(VerificationStatus.PENDING);
	}

	public List<DoctorAvailabilityBlock> getAvailability(Long doctorId) {
		ensureDoctorExists(doctorId);
		List<DoctorAvailabilityBlock> blocks = new ArrayList<>(availabilityRepo.findByDoctorId(doctorId));
		blocks.sort(Comparator
				.comparingInt((DoctorAvailabilityBlock b) -> b.getDayOfWeek().getValue())
				.thenComparing(DoctorAvailabilityBlock::getStartTime));
		return blocks;
	}

	public List<DoctorAvailabilityBlock> getMyAvailability(Long userId) {
		DoctorProfile p = repo.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No profile"));
		return getAvailability(p.getId());
	}

	@Transactional
	public List<DoctorAvailabilityBlock> setMyAvailability(Long userId, List<UpsertDoctorAvailabilityRequest.AvailabilityBlock> blocks) {
		DoctorProfile p = repo.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No profile"));
		Long doctorId = p.getId();

		validateAvailabilityBlocks(blocks);

		availabilityRepo.deleteByDoctorId(doctorId);
		List<DoctorAvailabilityBlock> toSave = blocks.stream()
				.map(b -> new DoctorAvailabilityBlock(doctorId, b.dayOfWeek(), b.startTime(), b.endTime()))
				.toList();
		availabilityRepo.saveAll(toSave);
		return getAvailability(doctorId);
	}

	public List<Instant> generateSlots(Long doctorId, int days) {
		ensureDoctorExists(doctorId);
		if (days < 1 || days > 30) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "days must be between 1 and 30");
		}
		Instant from = Instant.now().plus(Duration.ofMinutes(1));
		Instant to = from.plus(Duration.ofDays(days));
		return generateSlots(doctorId, from, to);
	}

	public boolean isSlotAllowed(Long doctorId, Instant slotTime) {
		ensureDoctorExists(doctorId);
		if (slotTime == null) {
			return false;
		}
		if (!slotTime.equals(slotTime.truncatedTo(ChronoUnit.MINUTES))) {
			return false;
		}

		ZonedDateTime zdt = ZonedDateTime.ofInstant(slotTime, AVAILABILITY_ZONE);
		DayOfWeek dow = zdt.getDayOfWeek();
		LocalTime t = zdt.toLocalTime();
		List<DoctorAvailabilityBlock> blocks = availabilityRepo.findByDoctorId(doctorId);
		for (DoctorAvailabilityBlock b : blocks) {
			if (b.getDayOfWeek() != dow) {
				continue;
			}
			if (t.isBefore(b.getStartTime())) {
				continue;
			}
			if (t.plusMinutes(SLOT_MINUTES).isAfter(b.getEndTime())) {
				continue;
			}
			long diffMinutes = ChronoUnit.MINUTES.between(b.getStartTime(), t);
			if (diffMinutes % SLOT_MINUTES == 0) {
				return true;
			}
		}
		return false;
	}

	private List<Instant> generateSlots(Long doctorId, Instant fromInclusive, Instant toExclusive) {
		if (toExclusive.isBefore(fromInclusive) || toExclusive.equals(fromInclusive)) {
			return List.of();
		}

		List<DoctorAvailabilityBlock> blocks = availabilityRepo.findByDoctorId(doctorId);
		if (blocks.isEmpty()) {
			return List.of();
		}
		Map<DayOfWeek, List<DoctorAvailabilityBlock>> byDow = blocks.stream()
				.collect(Collectors.groupingBy(DoctorAvailabilityBlock::getDayOfWeek));

		LocalDate startDate = ZonedDateTime.ofInstant(fromInclusive, AVAILABILITY_ZONE).toLocalDate();
		LocalDate endDate = ZonedDateTime.ofInstant(toExclusive, AVAILABILITY_ZONE).toLocalDate();

		List<Instant> out = new ArrayList<>();
		for (LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
			List<DoctorAvailabilityBlock> dayBlocks = byDow.get(d.getDayOfWeek());
			if (dayBlocks == null || dayBlocks.isEmpty()) {
				continue;
			}
			for (DoctorAvailabilityBlock b : dayBlocks) {
				LocalTime t = b.getStartTime();
				while (!t.plusMinutes(SLOT_MINUTES).isAfter(b.getEndTime())) {
					Instant slot = d.atTime(t).atZone(AVAILABILITY_ZONE).toInstant();
					if (!slot.isBefore(fromInclusive) && slot.isBefore(toExclusive)) {
						out.add(slot);
						if (out.size() >= MAX_SLOTS_RESPONSE) {
							out.sort(Comparator.naturalOrder());
							return out;
						}
					}
					t = t.plusMinutes(SLOT_MINUTES);
				}
			}
		}

		out.sort(Comparator.naturalOrder());
		return out;
	}

	private void validateAvailabilityBlocks(List<UpsertDoctorAvailabilityRequest.AvailabilityBlock> blocks) {
		if (blocks == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "blocks is required");
		}
		if (blocks.size() > MAX_AVAILABILITY_BLOCKS) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Too many availability blocks");
		}

		for (UpsertDoctorAvailabilityRequest.AvailabilityBlock b : blocks) {
			if (b == null || b.dayOfWeek() == null || b.startTime() == null || b.endTime() == null) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid availability block");
			}
			if (!b.startTime().isBefore(b.endTime())) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Availability startTime must be before endTime");
			}
			long minutes = ChronoUnit.MINUTES.between(b.startTime(), b.endTime());
			if (minutes < SLOT_MINUTES) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Availability block must be at least " + SLOT_MINUTES + " minutes");
			}
		}

		Map<DayOfWeek, List<UpsertDoctorAvailabilityRequest.AvailabilityBlock>> byDay = blocks.stream()
				.collect(Collectors.groupingBy(UpsertDoctorAvailabilityRequest.AvailabilityBlock::dayOfWeek));
		for (Map.Entry<DayOfWeek, List<UpsertDoctorAvailabilityRequest.AvailabilityBlock>> e : byDay.entrySet()) {
			List<UpsertDoctorAvailabilityRequest.AvailabilityBlock> sorted = new ArrayList<>(e.getValue());
			sorted.sort(Comparator
					.comparing(UpsertDoctorAvailabilityRequest.AvailabilityBlock::startTime)
					.thenComparing(UpsertDoctorAvailabilityRequest.AvailabilityBlock::endTime));

			UpsertDoctorAvailabilityRequest.AvailabilityBlock prev = null;
			for (UpsertDoctorAvailabilityRequest.AvailabilityBlock cur : sorted) {
				if (prev != null && prev.endTime().isAfter(cur.startTime())) {
					throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Availability blocks overlap on " + e.getKey());
				}
				prev = cur;
			}
		}
	}

	private void ensureDoctorExists(Long doctorId) {
		if (doctorId == null || doctorId <= 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid doctorId");
		}
		if (!repo.existsById(doctorId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found");
		}
	}

	@Transactional
	public DoctorProfile approve(Long doctorId) {
		DoctorProfile p = repo.findById(doctorId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
		p.setStatus(VerificationStatus.VERIFIED);
		p.setRejectionReason(null);
		DoctorProfile saved = repo.save(p);

		rabbit.convertAndSend(RabbitConfig.EXCHANGE, "doctor.verified",
				new DoctorEvents.DoctorVerified(saved.getId(), saved.getUserId(), saved.getSpecialization(), Instant.now()));

		return saved;
	}

	@Transactional
	public DoctorProfile reject(Long doctorId, String reason) {
		DoctorProfile p = repo.findById(doctorId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Doctor not found"));
		p.setStatus(VerificationStatus.REJECTED);
		p.setRejectionReason(reason);
		DoctorProfile saved = repo.save(p);

		rabbit.convertAndSend(RabbitConfig.EXCHANGE, "doctor.rejected",
				new DoctorEvents.DoctorRejected(saved.getId(), saved.getUserId(), reason, Instant.now()));

		return saved;
	}
}

