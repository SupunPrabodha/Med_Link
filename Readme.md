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

> Note: The full product scope in `requirements.md` (telemedicine, AI symptom checker, etc.) is included as **architecture** and **extensible placeholders**. The runnable implementation focuses on core DS patterns + primary workflows (Auth + Doctor verification + Appointment + Payments + Notifications).

---

## ✅ Implemented Services (runnable)

| Service | Port | Purpose |
|---|---:|---|
| `service-discovery` | 8761 | Eureka server for service registration |
| `api-gateway` | 8090 | Entry point, routing, JWT validation + RBAC |
| `auth-service` | 8081 | Register/login, issues JWT |
| `patient-service` | 8086 | Patient service scaffold (env + DB + ping endpoint) |
| `appointment-service` | 8082 | Appointment CRUD, publishes RabbitMQ events |
| `notification-service` | 8083 | Consumes events, logs "email/SMS" notifications |
| `doctor-service` | 8084 | Doctor onboarding + admin verification |
| `payment-service` | 8085 | PayHere-style payment intents + notify callback (signature validation) |

### Infrastructure (Docker)
- PostgreSQL for Auth (`authdb`) on port `5432`
- PostgreSQL for Appointment (`appointmentdb`) on host port `5433`
- PostgreSQL for Doctor (`doctordb`) on host port `5434`
- PostgreSQL for Payments (`paymentdb`) on host port `5435`
- PostgreSQL for Patient (`patientdb`) on host port `5436`
- RabbitMQ + Management UI on ports `5672` and `15672`

---

## ⚙️ Tech Stack

- Java (project builds on **Java 17** in this environment; designed for **Java 21** per requirements)
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
- Auth Service OpenAPI: http://localhost:8081/swagger-ui/index.html
- Add telemedicine-service (Jitsi meeting provisioning)
- Add patient profile/report upload service
- Add prescriptions service
- Add AI symptom checker service
- Persist notification logs + audit trail

---

## 🧪 Quick Workflow Test (Auth ➜ Appointment ➜ Notification)

1) Register a patient:
- `POST http://localhost:8090/api/auth/register`
- `POST http://localhost:8090/api/auth/login`

Body:
```json
{ "email": "patient1@demo.com", "password": "Passw0rd!", "role": "PATIENT" }
```

Note (Windows/PowerShell): `curl` quoting can easily mangle JSON. If you see `401` with `WWW-Authenticate: Basic realm=\"Realm\"` or JSON parse errors in logs, use PowerShell instead:

```powershell
$body = @{ email = 'patient1@demo.com'; password = 'Passw0rd!'; role = 'PATIENT' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:8090/api/auth/register' -ContentType 'application/json' -Body $body
```

2) Copy `accessToken`, then create appointment:
- `POST http://localhost:8090/api/appointments`
- Header: `Authorization: Bearer <token>`

Body:
```json
{ "doctorId": 10, "slotTime": "2030-01-01T10:00:00Z" }
```

3) Watch logs in `notification-service` – it should log the consumed `appointment.created` event.

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
- RabbitMQ async events: ✅ (appointment.created/cancelled)
- PostgreSQL per service: ✅ (separate auth + appointment DBs)
- Docker Compose: ✅
- Kubernetes manifests (Deployments, Services, ConfigMaps, Secrets, Ingress): ✅
- Swagger API specs: ✅
- Tests (unit-level): ✅

---

## Next Steps (optional to expand)

- Add `doctor-service` and availability search
- Add `payment-service` (PayHere sandbox webhook)
- Add `telemedicine-service` (Jitsi meeting provisioning)
- Add notification persistence and real email provider integration

---

## Troubleshooting

### Docker / Compose not connecting

If you see an error like `open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`, it means **Docker Desktop isn't running** (or Docker Engine isn't installed).

- Start Docker Desktop and wait until it says it's running.
- Then re-run `docker compose up -d`.

> The code will still **build and pass unit tests** without Docker, but the full end-to-end workflow needs RabbitMQ + Postgres.
