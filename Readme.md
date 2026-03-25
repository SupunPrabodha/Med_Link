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

> Note: The full product scope in `requirements.md` (telemedicine, payments, AI symptom checker) is included as **architecture** and **extensible placeholders**. The runnable implementation focuses on the core DS patterns + primary workflows (Auth + Appointment + Notification).

---

## ✅ Implemented Services (runnable)

| Service | Port | Purpose |
|---|---:|---|
| `service-discovery` | 8761 | Eureka server for service registration |
| `api-gateway` | 8090 | Entry point, routing, JWT validation + RBAC |
| `auth-service` | 8081 | Register/login, issues JWT |
| `appointment-service` | 8082 | Appointment CRUD, publishes RabbitMQ events |
| `notification-service` | 8083 | Consumes events, logs "email/SMS" notifications |

### Infrastructure (Docker)
- PostgreSQL for Auth (`authdb`) on port `5432`
- PostgreSQL for Appointment (`appointmentdb`) on host port `5433`
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

### 1) Start infrastructure (Postgres + RabbitMQ)

```powershell
cd "F:\Projects\DS Project"
docker compose up -d
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
mvn -pl appointment-service spring-boot:run
mvn -pl notification-service spring-boot:run
mvn -pl api-gateway spring-boot:run
```

Gateway: http://localhost:8090

> Want port 8080 instead? Run gateway with:
> `mvn -pl api-gateway spring-boot:run -Dspring-boot.run.arguments="--server.port=8080"`

Eureka dashboard: http://localhost:8761

---

## 🔎 Swagger / OpenAPI

- Gateway Swagger UI: http://localhost:8090/swagger
- Auth Service OpenAPI: http://localhost:8081/swagger-ui/index.html
- Appointment Service OpenAPI: http://localhost:8082/swagger-ui/index.html

---

## 🧪 Quick Workflow Test (Auth ➜ Appointment ➜ Notification)

1) Register a patient:
- `POST http://localhost:8090/api/auth/register`

Body:
```json
{ "email": "patient1@demo.com", "password": "Passw0rd!", "role": "PATIENT" }
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
