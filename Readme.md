# 🏥 MediLink LK – AI-Enabled Telemedicine & Appointment Platform

## 📌 Project Introduction

MediLink LK is a distributed, microservices-based healthcare platform concept designed to modernize digital medical services in Sri Lanka.

This repository contains a **marks-aligned, runnable microservices skeleton** demonstrating:
- Microservices separation (independent deployables)
- API Gateway pattern
- Service Discovery (Eureka)
- JWT auth + basic RBAC (enforced at Gateway)
- Async event-driven messaging (RabbitMQ)
- Per-service data ownership (PostgreSQL per service)
- Professional documentation, Swagger/OpenAPI, and tests

> This repository implements the assignment’s core workflows end-to-end (through the gateway), including appointments, payments, telemedicine sessions, notifications, prescriptions, and an optional symptom checker. See `requirements.md` for requirement coverage and `scripts/smoke-test.ps1` for a repeatable proof run.

Admin workflows implemented in UI (marker-friendly):
- Doctor verification (approve/reject)
- User management (list/search registered accounts)
- Appointment management (admin can view/cancel appointments)
- Platform status checks

---

## ✅ Implemented Services (runnable)

| Service | Port | Purpose |
|---|---:|---|
| `service-discovery` | 8761 | Eureka server for service registration |
| `api-gateway` | 8090 | Entry point, routing, JWT validation + RBAC |
| `auth-service` | 8081 | Register/login, issues JWT |
| `doctor-service` | 8084 | Doctor onboarding + admin verification |
| `payment-service` | 8085 | Payments: PayHere intent + callback, and Stripe Checkout + webhook (signature verification) |
| `appointment-service` | 8082 | Appointment CRUD + SSE real-time status updates + event publishing |
| `patient-service` | 8086 | Patient profile + medical reports (upload/list/download/delete) |
| `telemedicine-service` | 8087 | Jitsi join URL provisioning + consultation completion |
| `prescription-service` | 8088 | Doctor issues prescriptions; patient views prescriptions |
| `notification-service` | 8083 | In-app notifications (persisted) + optional Email/SMS when configured |
| `symptom-checker-service` | 8089 | Symptom triage + recommended specialties (+ optional ML inference) |
| `ai-symptom-service` | 8010 | Optional FastAPI inference for symptom checker |
| `frontend` | 5173 | React UI served via Nginx |

### Infrastructure (Docker)
- PostgreSQL for Auth (`authdb`) on port `5432`
- PostgreSQL for Appointment (`appointmentdb`) on host port `5433`
- PostgreSQL for Doctor (`doctordb`) on host port `5434`
- PostgreSQL for Payments (`paymentdb`) on host port `5435`
- PostgreSQL for Patient (`patientdb`) on host port `5436`
- PostgreSQL for Telemedicine (`telemedicinedb`) on host port `5437`
- PostgreSQL for Prescription (`prescriptiondb`) on host port `5438`
- PostgreSQL for Notification (`notificationdb`) on host port `5439`
- PostgreSQL for Symptom checker (`symptomdb`) on host port `5440`
- RabbitMQ + Management UI on ports `5672` and `15672`

---

## ⚙️ Tech Stack

- Java 17
- Spring Boot, Spring Cloud (Gateway, Eureka)
- Spring Security (BCrypt password hashing)
- JWT (jjwt)
- RabbitMQ (Spring AMQP)
- PostgreSQL (Spring Data JPA)
- OpenAPI/Swagger (springdoc)
- Docker Compose + Kubernetes manifests

---

## 🧠 Architecture & Diagrams

- See `docs/architecture.md` (includes Mermaid diagrams)

---

## 🚀 How to Run (Local)

### Option 1 (recommended for marking): Run everything with Docker Compose

This starts **all infrastructure + all microservices** as containers.

```powershell
cd "F:\Projects\DS Project"
docker compose up -d --build
```

Optional configuration (host env vars or a `.env` file next to `docker-compose.yml`):
- `PAYHERE_MERCHANT_ID` (defaults to `1211149`)
- `PAYHERE_MERCHANT_SECRET` (defaults to `change-me`)
- `STRIPE_SECRET_KEY` (Stripe test secret key)
- `STRIPE_WEBHOOK_SECRET` (Stripe webhook signing secret)
- `APP_GATEWAY_BASE_URL` (defaults to `http://api-gateway:8090` inside Docker)

Key URLs:
- Frontend UI: http://localhost:5173
- Eureka: http://localhost:8761
- Gateway: http://localhost:8090
- Gateway Swagger UI: http://localhost:8090/swagger
- RabbitMQ UI: http://localhost:15672 (guest/guest)

Stop:
```powershell
docker compose down
```

### ✅ One-command workflow verification (recommended)

This script runs a complete marker-friendly flow through the **gateway**:
`ADMIN + DOCTOR + PATIENT` registration → doctor profile → admin approval → appointment → payment intent → **signed provider callback** → appointment becomes **CONFIRMED**.

```powershell
cd "F:\Projects\DS Project"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1
```

Notes:
- By default the smoke test runs `docker compose up -d --build`.
- To skip rebuilds (faster on lab machines), set `SMOKE_BUILD=0`.
- Default payment provider is PayHere. To run in Stripe mode: set `SMOKE_PAYMENT_PROVIDER=stripe` and ensure `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` are available (in your shell env or in `.env`).
- If you override `PAYHERE_MERCHANT_SECRET` for Compose, also set the same value when running the smoke test (so it can generate a valid `md5sig`).

### Option 2 (dev): Start infrastructure only, run services via Maven

### 1) Start infrastructure (Postgres + RabbitMQ)

```powershell
cd "F:\Projects\DS Project"
docker compose up -d postgres-auth postgres-appointment postgres-doctor postgres-payment postgres-patient rabbitmq
```

RabbitMQ UI: http://localhost:15672 (guest/guest)

### 2) Build all services

```powershell
cd "F:\Projects\DS Project"
mvn -DskipTests=false test
```

### 3) Run services (separate terminals)

```powershell
mvn -pl service-discovery spring-boot:run
mvn -pl auth-service spring-boot:run
mvn -pl doctor-service spring-boot:run
mvn -pl appointment-service spring-boot:run
mvn -pl payment-service spring-boot:run
mvn -pl notification-service spring-boot:run
mvn -pl api-gateway spring-boot:run
```

Gateway: http://localhost:8090

### A) Create users
Register 3 users via gateway:
- Admin: `role=ADMIN`
- Doctor: `role=DOCTOR`
- Patient: `role=PATIENT`

Endpoints:
### B) Doctor onboarding + admin verification
1) Doctor creates profile:
2) Admin approves:
- `GET http://localhost:8090/api/admin/doctors/pending`
- Header: `Authorization: Bearer <adminToken>`

### D) Create PayHere payment intent (realistic)
### E) PayHere notify callback
PayHere will call the notify URL:
`payment-service` verifies the **MD5 signature** and publishes `payment.completed`, which the `appointment-service` consumes to mark the appointment **CONFIRMED** and publish `appointment.confirmed`.

### F) Verify
- `GET http://localhost:8090/api/appointments` should show `CONFIRMED`
- `api-gateway/`, `auth-service/`, `appointment-service/`, `notification-service/`, `doctor-service/`, `payment-service/`, `service-discovery/` – independent microservices (Maven modules)
  - payment completed
  - appointment confirmed
  - doctor verified

This returns:
- `checkoutUrl` (PayHere sandbox)
- `formFields` (merchant_id, order_id, amount, currency, notify_url, ...)

- RabbitMQ async events: ✅ (appointment.* / doctor.* / payment.*)
- PostgreSQL per service: ✅ (auth + appointment + doctor + payment DBs)

### C) Patient creates appointment (PENDING_PAYMENT)
- Header: `Authorization: Bearer <patientToken>`

---

## 🔎 Swagger / OpenAPI

- Gateway Swagger UI: http://localhost:8090/swagger

For marking/demo, prefer the Gateway Swagger since it exercises routing + RBAC through the gateway.

---

## 🧪 Quick Workflow Test (Auth ➜ Appointment ➜ Notification)

Use the automated script for a full end-to-end verification:

```powershell
cd "F:\Projects\DS Project"
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1
```

Manual note (Windows/PowerShell): `curl.exe` quoting can mangle JSON. Prefer `Invoke-RestMethod` for `application/json` requests.

---

## ☸️ Kubernetes (required artifacts)

The `k8s/` folder contains minimal manifests demonstrating:
- Deployments / Services
- ConfigMaps
- Secrets
- Ingress

See `k8s/README.md`.

---

## 📦 Repo Structure

- `api-gateway/`, `auth-service/`, `appointment-service/`, `notification-service/`, `service-discovery/` – independent microservices (Maven modules)
- `docker-compose.yml` – local infrastructure
- `k8s/` – Kubernetes manifests
- `docs/` – architecture and workflow diagrams

---

## 🎯 Requirements Coverage (high level)

- Microservices + API Gateway + Eureka: ✅
- JWT authentication + RBAC: ✅ (enforced at gateway; BCrypt in auth)
- RabbitMQ async events: ✅ (event-driven confirmations/notifications across core workflows)
- PostgreSQL per service: ✅ (auth + patient + doctor + appointment + payment + telemedicine + prescription + notification + symptom)
- Docker Compose: ✅
- Kubernetes manifests (Deployments, Services, ConfigMaps, Secrets, Ingress): ✅
- Swagger API specs: ✅
- Tests (unit-level): ✅

---

## Optional Enhancements

- Validate real Email/SMS delivery by configuring Brevo/Twilio env vars
- Stripe end-to-end demo (webhook secret + test events)
- Deploy on Kubernetes with ingress and show probes/health in the demo

---

## Troubleshooting

### Docker / Compose not connecting

If you see an error like `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`, it means **Docker Desktop isn't running** (or Docker Engine isn't installed).

- Start Docker Desktop and wait until it says it's running.
- Then re-run `docker compose up -d`.

> The code will still **build and pass unit tests** without Docker, but the full end-to-end workflow needs RabbitMQ + Postgres.

### Docker BuildKit / IO errors during rebuild

If Docker Desktop is unstable (500 errors / I/O errors), avoid forcing rebuilds:
- Run `scripts/smoke-test.ps1` with `SMOKE_BUILD=0`.
- If you must rebuild, try restarting Docker Desktop and running `docker builder prune`.

## 🌐 Live Hosting (minimal guide)

For a “live website” style demo on a VPS:
1) Install Docker + Docker Compose on the server.
2) Copy the repo to the server.
3) Create a `.env` file (same folder as `docker-compose.yml`) and set at minimum:
  - `SECURITY_JWT_SECRET` (use a long random value)
  - `PAYHERE_MERCHANT_ID` / `PAYHERE_MERCHANT_SECRET` (optional; keep defaults for demo)
4) Start:

```bash
docker compose up -d --build
```

5) Put a reverse proxy (nginx/Caddy) in front for domain + TLS, and forward to:
- UI: `frontend` (container port 80)
- API: `api-gateway` (container port 8090)
