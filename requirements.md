# MediLink LK – AI-Enabled Smart Healthcare Platform (Microservices)

This document is aligned with the **assignment requirements** you pasted (patients book appointments, telemedicine, reports, prescriptions, payments, notifications, optional AI symptom checker) and describes:
1) what is already implemented in this repo
2) what is still missing / needs improvement to maximize marks

---

## 1) Services implemented in this repository

| Service | Status | Purpose (high level) |
|---|---|---|
| `service-discovery` (Eureka) | ✅ Implemented | Service registration/discovery |
| `api-gateway` | ✅ Implemented | Routing + JWT validation + RBAC enforcement |
| `auth-service` | ✅ Implemented | Register/login, issues JWT, roles (`PATIENT`/`DOCTOR`/`ADMIN`) |
| `patient-service` | ✅ Implemented | Patient profile + profile photo + medical report upload/list/download/delete |
| `doctor-service` | ✅ Implemented | Doctor profile + availability schedules + profile photo + admin verification |
| `appointment-service` | ✅ Implemented | Booking + modify/cancel + status tracking + publishes events |
| `payment-service` | ✅ Implemented | Stripe Checkout + webhook (signature verification) and PayHere flow (compatibility) |
| `telemedicine-service` | ✅ Implemented | Secure session provisioning based on appointment confirmation (Jitsi join URL) |
| `notification-service` | ✅ Implemented | In-app notifications + optional Email (Brevo) + SMS (Twilio) delivery when configured |
| `prescription-service` | ✅ Implemented | Digital prescriptions (doctor issues, patient views) |
| `ai-symptom-checker-service` | ❌ Not implemented | Optional enhancement (AI symptom checker) |

Frontend:
- ✅ Web UI implemented (`frontend/` – React + Vite + Tailwind)
- ❌ Mobile app not implemented (not required if “web or mobile” is satisfied)

---

## 2) Feature coverage vs assignment requirements

Legend:
- ✅ Implemented
- 🟡 Partially implemented / needs polish
- ❌ Not implemented

### Web/Mobile interface
- ✅ Web UI for patient/doctor/admin flows
- 🟡 UX polish and “professional” profile fields still needed
- ❌ Mobile app (optional if web is acceptable)

### Patient Management Service
Patient role requirements:
- ✅ Register/login (via `auth-service`)
- ✅ Manage profile
- ✅ Upload medical reports/documents
- 🟡 View “medical history” (reports exist; structured longitudinal history is limited)
- ✅ View prescriptions (via `prescription-service`)
- ✅ Attend video consultations (telemedicine join URLs)

### Doctor Management Service
Doctor role requirements:
- ✅ Manage profile
- ✅ Set availability schedules
- ✅ Accept/reject appointment requests (doctor approval endpoint)
- ✅ Conduct telemedicine sessions (Jitsi join URLs)
- ✅ Issue digital prescriptions
- ✅ View patient-uploaded reports (doctor endpoint via appointment-service → patient-service internal download)

### Admin role
- ✅ Manage user accounts (list/search in gateway/admin UI)
- ✅ Verify doctor registrations (approve/reject)
- 🟡 Oversee platform operations/transactions (admin can view payments/appointments; improve audit/reporting for “professional” finish)

### Appointment Service
- ✅ Search doctors by specialty (doctor-service supports `GET /api/doctors?specialization=...`)
- ✅ Book appointments
- ✅ Cancel bookings
- ✅ Modify bookings (reschedule endpoint exists)
- 🟡 “Track appointment status in real time” (status exists and updates via events; add UI auto-refresh/SSE/WebSocket for real-time feel)

### Telemedicine (Video Session Integration)
- ✅ Jitsi-based sessions (join URL)
- 🟡 “Consultation completion” workflow (a clear “end session / completed” action + event is not fully implemented)

### Payment Service
- ✅ Stripe (sandbox) checkout + webhook validation
- ✅ PayHere flow kept for compatibility / marker-friendly smoke tests

### Notification Service
- ✅ Event-driven notifications (RabbitMQ)
- ✅ In-app notifications page
- ✅ Optional real delivery when configured:
  - Email via Brevo
  - SMS via Twilio
- 🟡 Ensure “booking confirmation” + “consultation completion” notifications are both covered end-to-end (completion event currently needs strengthening)

### AI Symptom Checker (Optional Enhancement)
- ❌ Not implemented (optional)

---

## 3) What to do to maximize marks (recommended checklist)

### A) Must-have for full marks (core requirements + marking friendliness)
1. **Kubernetes deployment that actually runs**
   - Ensure manifests cover the *full* runnable set (gateway, discovery, all services, RabbitMQ, Postgres, secrets/configmaps, ingress)
   - Provide a “single command” runbook for K8s (minikube/docker-desktop)
2. **End-to-end demo workflow that proves requirements**
   - Keep and extend the existing smoke test to verify all key flows through the gateway
3. **Appointment modify/reschedule UI + notifications**
   - Expose reschedule in UI (patient)
   - Ensure reschedule sends notifications (in-app + optional email/SMS)
4. **Consultation completion lifecycle**
   - Add a doctor action to mark a telemedicine session “COMPLETED”
   - Publish an event and send notifications (“consultation completed”)

### B) Professionalization (high impact, low risk)
1. **Richer profile fields** (requested: “make the site more professional”)
   - Patient examples: gender, blood group, allergies, chronic conditions, emergency contact, NIC/passport
   - Doctor examples: qualifications, years of experience, languages, clinic/hospital, consultation fee, bio
2. **Audit trail & admin reporting**
   - Show payment history, appointment history, doctor verification decisions (timestamps + actor)
3. **Notification persistence**
   - Store notifications in Postgres (instead of in-memory) to survive restarts

### C) Optional (extra marks)
1. Implement **AI symptom checker** as a separate microservice (even basic rules/LLM integration) with clear disclaimer.

---

## 4) Security notes (for marking + “production-like” quality)

- ✅ JWT authentication + gateway RBAC is implemented.
- 🟡 For a “production-like” deployment, avoid exposing internal service ports directly (only expose gateway/ingress) to prevent bypassing RBAC.
- ✅ Internal service-to-service lookups used for notification delivery are protected by a shared internal token.

---

## 5) DevOps / Deployment

### Docker
- ✅ Docker Compose for local run (per-service Postgres + RabbitMQ)

### Kubernetes
- ✅ `k8s/` folder exists (Deployments, Services, ConfigMaps, Secrets, Ingress)
- 🟡 Needs verification and alignment with the full service set (including prescriptions/telemedicine/notifications/payment)

---

## 6) Testing & documentation

- ✅ OpenAPI/Swagger is available per service and via gateway.
- 🟡 Improve test coverage around:
  - appointment lifecycle transitions
  - payment callbacks/webhook verification
  - notifications delivery error handling
  - RBAC access checks
- ✅ Architecture diagrams exist in `docs/architecture.md`.

---
