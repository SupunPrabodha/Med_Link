package lk.medilink.notification.delivery;

import org.springframework.stereotype.Service;

@Service
public class NotificationDeliveryService {
	private final ContactLookupClient contacts;
	private final BrevoEmailSender email;
	private final TwilioSmsSender sms;

	public NotificationDeliveryService(ContactLookupClient contacts,
	                                 BrevoEmailSender email,
	                                 TwilioSmsSender sms) {
		this.contacts = contacts;
		this.email = email;
		this.sms = sms;
	}

	public void deliverToPatientUser(Long userId, String subject, String message) {
		if (userId == null || userId <= 0) return;
		email.send(contacts.emailForUser(userId), subject, message);
		sms.send(contacts.phoneForPatientUser(userId), message);
	}

	public Long deliverToDoctorId(Long doctorId, String subject, String message) {
		if (doctorId == null || doctorId <= 0) return null;
		ContactLookupClient.InternalDoctorContact c = contacts.doctorContactByDoctorId(doctorId);
		if (c == null || c.userId() == null || c.userId() <= 0) return null;
		email.send(contacts.emailForUser(c.userId()), subject, message);
		sms.send(c.phone(), message);
		return c.userId();
	}

	public void deliverToDoctorUser(Long userId, String subject, String message) {
		if (userId == null || userId <= 0) return;
		ContactLookupClient.InternalDoctorContact c = contacts.doctorContactByUserId(userId);
		email.send(contacts.emailForUser(userId), subject, message);
		sms.send(c == null ? null : c.phone(), message);
	}
}
