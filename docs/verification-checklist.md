# MediLink LK – Verification Checklist (UI + API)

This checklist is designed to match the **implemented scope** described in `Readme.md` (gateway + discovery + JWT/RBAC + async events + per-service DBs + Docker/K8s).

## 1) Services up (Docker)

- Start: `docker compose up -d --build`
- Frontend: http://localhost:5173
- Gateway: http://localhost:8090
- Gateway health: http://localhost:8090/actuator/health
- Gateway Swagger UI: http://localhost:8090/swagger
- Eureka: http://localhost:8761
- RabbitMQ UI: http://localhost:15672 (guest/guest)

Expected:
- All `/actuator/health` endpoints return **200**
- Eureka shows services registered: `api-gateway`, `auth-service`, `doctor-service`, `appointment-service`, `payment-service`, `notification-service`, `patient-service`

## 2) UI walkthrough (marker-friendly)

### A) Register + Login

- Open http://localhost:5173
- Register three users (use different emails):
  - `PATIENT`
  - `DOCTOR`
  - `ADMIN`

Expected:
- PATIENT goes to `/app`
- DOCTOR goes to `/app/doctor/profile`
- ADMIN goes to `/app/admin/doctors`

### B) Doctor onboarding + admin verification

- As DOCTOR:
  - Go to **My Doctor Profile**
  - Fill details (full name, registration no, specialization) and **Save profile**

Expected:
- Profile status becomes **PENDING**
- Doctor is **not** listed in the public Doctors page yet

- As ADMIN:
  - Go to **Verify Doctors**
  - Approve the pending doctor

Expected:
- Status becomes **VERIFIED**
- Verified doctor appears in **Doctors** search/list

### C) Appointment creation (patient)

- As PATIENT:
  - Go to **Appointments**
  - Create an appointment for a **verified** doctor id

Expected:
- Appointment created with status **PENDING_PAYMENT**

### D) Payment intent + PayHere notify callback

- As PATIENT:
  - Go to **Payments**
  - Create a payment intent for the appointment

Expected:
- Intent returns checkout data (URL + form fields)

Backend async behavior (key rubric point):
- `payment-service` accepts a signed PayHere notify callback
- `appointment-service` consumes the `payment.completed` event (RabbitMQ) and marks appointment **CONFIRMED**
- `notification-service` consumes events and logs notifications

## 3) API checks (via gateway)

Base URL: `http://localhost:8090`

- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`

- RBAC expectations (enforced at gateway):
  - `GET /api/admin/doctors/pending` should return **403** for non-admin
  - Patient endpoints should require `PATIENT` (or `ADMIN`) token

- Doctor:
  - `POST /api/doctors/me/profile` (DOCTOR)
  - `GET /api/admin/doctors/pending` (ADMIN)
  - `POST /api/admin/doctors/{id}/approve` (ADMIN)
  - `GET /api/doctors` (lists verified doctors)

- Appointment:
  - `POST /api/appointments` (PATIENT/ADMIN)
  - `GET /api/appointments` (PATIENT/ADMIN)

- Payments:
  - `POST /api/payments/intents/payhere` (PATIENT/ADMIN)
  - `POST /api/payments/callback/payhere` (signature validated)

## 4) One-command automated verification

- Run: `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1`

Expected:
- Admin+Doctor+Patient created (or reused)
- Doctor profile created + approved
- Appointment created and transitions to **CONFIRMED** after notify

