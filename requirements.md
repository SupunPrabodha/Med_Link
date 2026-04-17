
# MediLink LK – Requirements Coverage Checklist (SE3020 DS Assignment 1)

This file maps the **official assignment requirements** → **what exists in this repository** → **what is missing/partial**.

Legend:
- ✅ Implemented end-to-end
- 🟡 Implemented but needs proof/polish (or not fully end-to-end)
- ❌ Missing

---

## 1) Services implemented in this repository (backend)

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
| `symptom-checker-service` | ✅ Implemented | Symptom triage + recommended specialties + assessment history |
| `ai-symptom-service` (FastAPI) | ✅ Implemented | Optional ML inference for symptom-checker (Kaggle-trained model) |

Frontend:
- ✅ Web UI implemented (`frontend/` – React + Vite)
- ❌ Mobile app not implemented (OK because requirement says web/mobile; web is sufficient)

---

## 2) Feature coverage vs assignment requirements (what the marker expects)

### 2.1 Web/Mobile interface
- ✅ Web UI for patient/doctor/admin flows (`frontend/src/pages/*`)
- 🟡 “User-friendly on various devices” depends on your demo (responsive UI exists, but you must *show it* in the video)
- ❌ Mobile app (not required if web is delivered)

### 2.2 Patient Management Service
Patient role (required):
- ✅ Register/login (JWT via `auth-service` + `api-gateway`)
- ✅ Manage profile (`patient-service`)
- ✅ Upload medical reports/documents (`patient-service`)
- ✅ View medical history (consolidated timeline view in the frontend combining reports + appointments + prescriptions)
- ✅ View prescriptions (`prescription-service`)
- ✅ Attend video consultations (Jitsi join URL via `telemedicine-service`)

### 2.3 Doctor Management Service
Doctor role (required):
- ✅ Manage profile (`doctor-service`)
- ✅ Manage availability schedules (`doctor-service`)
- ✅ Accept/reject appointment requests (`appointment-service` doctor actions)
- ✅ Conduct telemedicine sessions (Jitsi join URL + room provisioning)
- ✅ Issue digital prescriptions (`prescription-service`)
- ✅ View patient-uploaded reports (patient reports exist; doctor flow depends on appointment context)

### 2.4 Appointment Service
- ✅ Search doctors by specialty (doctor list/search is implemented; UI supports browsing)
- ✅ Book appointments
- ✅ Modify/reschedule appointments
- ✅ Cancel appointments
- ✅ Track appointment status “in real time”
   - Appointment status transitions are broadcast via **SSE** from `appointment-service`.
   - The React UI consumes SSE using an authenticated (fetch-based) SSE client.

### 2.5 Telemedicine Service (Video Session Integration)
- ✅ Video integration using **Jitsi** (join URLs)
- ✅ Consultation completion endpoint exists (`POST /api/telemedicine/sessions/appointment/{id}/complete`)
- ✅ Consultation completion is proven end-to-end via `scripts/smoke-test.ps1` (doctor completes → patient + doctor notifications)

### 2.6 Payment Service
- ✅ Secure payments supported (sandbox)
   - Stripe Checkout + webhook signature validation
   - PayHere notify flow supported
- ✅ Admin “financial operations oversight” is present
   - Admin review / dispute / refund actions are implemented (persisted audit fields + admin endpoints + admin UI)

### 2.7 Notification Service
- ✅ Confirmation notifications exist for key events (event-driven via RabbitMQ)
- ✅ In-app notifications UI exists
- ✅ Optional real delivery supported when configured:
   - Email (Brevo)
   - SMS (Twilio)
- ✅ Notifications are persisted (notification-service uses Postgres in Docker/K8s)

### 2.8 Security / Authentication & Roles (must-have)
- ✅ Authentication: JWT validated at gateway
- ✅ Roles: `PATIENT`, `DOCTOR`, `ADMIN`
- ✅ Services receive identity via gateway-injected headers (`X-User-Id`, `X-User-Role`) and enforce access per endpoint

### 2.9 AI Symptom Checker Service (Optional Enhancement)
- ✅ Implemented and integrated end-to-end:
   - `symptom-checker-service` provides triage + specialties
   - `ai-symptom-service` provides optional ML inference (`POST /recommend-specialties`)
   - Frontend page exists (`SymptomCheckerPage.tsx`)
   - Safety note: chest-pain/emergency patterns intentionally bypass AI

---

## 3) Gaps / partially implemented items (quick “what’s missing” list)

These are the items most likely to be questioned in a viva or reduce marks if not demonstrated clearly:

1) ✅ **Consultation completion end-to-end proof**
   - Verified via `scripts/smoke-test.ps1`: appointment confirmed → telemedicine join → doctor marks complete → notifications created.

2) 🟡 **Kubernetes “it actually runs” proof (demo evidence)**
   - Manifests exist under `k8s/` and include readiness/liveness probes.
   - Ensure you can deploy and access via ingress in your recorded demo.

3) 🟡 **Submission deliverables** (as per assignment handout)
   - ✅ `submission.txt` exists (fill in your GitHub + YouTube links)
   - ✅ `readme.txt` exists (deployment steps)
   - ✅ `members.txt` exists (fill in member details)
   - ✅ `report.pdf` generated (source: `report.html`; reproducible via `scripts/build-report.ps1`)

---

## 4) Evidence pointers (where to look)

Backend (examples):
- Gateway JWT + header propagation: `api-gateway/src/main/java/.../JwtAuthGatewayFilter.java`
- Auth (register/login/admin users): `auth-service/src/main/java/.../AuthController.java`, `AdminUsersController.java`
- Patient profile + reports: `patient-service/src/main/java/.../PatientController.java`
- Doctor profile + availability + admin verification: `doctor-service/src/main/java/.../DoctorController.java`, `AdminDoctorController.java`
- Appointments + admin view: `appointment-service/src/main/java/.../AppointmentController.java`, `AdminAppointmentController.java`
- Payments: `payment-service/src/main/java/.../PaymentController.java`, `AdminPaymentController.java`, `StripeWebhookController.java`, `PayHereNotifyController.java`
- Telemedicine sessions + completion: `telemedicine-service/src/main/java/.../TelemedicineController.java`
- Prescriptions: `prescription-service/src/main/java/.../PrescriptionController.java`
- Notifications (API + persistence): `notification-service/src/main/java/.../NotificationController.java`, `store/NotificationStore.java`
- Symptom checker: `symptom-checker-service/src/main/java/.../SymptomCheckerController.java`
- ML inference microservice: `ai-symptom-service/app/main.py`

Frontend:
- Routes + role guards: `frontend/src/App.tsx`
- Pages list: `frontend/src/pages/*`

DevOps:
- Docker compose: `docker-compose.yml` and `.env`
- Kubernetes: `k8s/apps.yml`, `k8s/configmap.yml`, `k8s/secrets.yml`, `k8s/ingress.yml`
- Smoke test: `scripts/smoke-test.ps1`

---

## 5) Notes for the report/demo (to avoid viva surprises)

- When you claim a requirement is “implemented”, make sure the demo shows it end-to-end via the gateway.
- For “real-time status”, either implement server push or explain polling (and show that the status does update).
- For AI: include a disclaimer that it is **not** medical diagnosis; show “recommended specialties” output.

---
