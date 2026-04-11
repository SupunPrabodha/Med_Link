# MediLink LK – Rubric Mapping (Evidence)

This document maps **common distributed-systems marking criteria** to concrete evidence in this repository.

If your rubric differs, you can still use this as a “what to show” checklist.

## A) Dockerized runnable system

**Requirement:** System runs fully via Docker / Docker Compose.

**Evidence:**
- Start: `docker compose up -d --build`
- Running UI/services:
  - Frontend: http://localhost:5173
  - Gateway: http://localhost:8090
  - Eureka: http://localhost:8761
  - RabbitMQ UI: http://localhost:15672
- Compose definition: `docker-compose.yml`

## B) Microservices separation

**Requirement:** Independent services/modules (not a monolith).

**Evidence:**
- Separate Maven modules (each has its own `pom.xml` and Spring Boot app):
  - `api-gateway/`, `service-discovery/`, `auth-service/`, `doctor-service/`, `appointment-service/`, `payment-service/`, `notification-service/`, `patient-service/`
- Root aggregator: `pom.xml`

## C) Service discovery (Eureka)

**Requirement:** Services register with Eureka; routing can use logical service IDs.

**Evidence:**
- Eureka UI: http://localhost:8761
- REST registrations:
  - http://localhost:8761/eureka/apps/AUTH-SERVICE
  - http://localhost:8761/eureka/apps/DOCTOR-SERVICE
  - http://localhost:8761/eureka/apps/APPOINTMENT-SERVICE
  - http://localhost:8761/eureka/apps/PAYMENT-SERVICE
  - http://localhost:8761/eureka/apps/NOTIFICATION-SERVICE
  - http://localhost:8761/eureka/apps/PATIENT-SERVICE
  - http://localhost:8761/eureka/apps/API-GATEWAY

## D) API gateway pattern

**Requirement:** Single entry point, routing to services.

**Evidence:**
- Gateway base: http://localhost:8090
- Gateway routes configured in `api-gateway/src/main/resources/application.yml`.
- Swagger UI exposed from gateway: http://localhost:8090/swagger

## E) Authentication (JWT) + password hashing

**Requirement:** Register/login, JWT issued, passwords hashed.

**Evidence:**
- API:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- UI:
  - Register/Login pages on http://localhost:5173
- Tests:
  - `mvn test` includes JWT-related unit tests.

## F) RBAC authorization (role-based access)

**Requirement:** Protected endpoints require roles.

**Evidence (UI):**
- Create an ADMIN user; approve doctors only from Admin screen.

**Evidence (API):**
- `GET /api/admin/doctors/pending` returns `403` when called with a PATIENT token.
- This is asserted in the smoke test: `scripts/smoke-test.ps1`.

## G) Per-service data ownership (PostgreSQL per service)

**Requirement:** Each service has its own DB (not shared).

**Evidence:**
- Compose provisions multiple Postgres containers with different DBs/ports:
  - auth: 5432
  - appointment: 5433
  - doctor: 5434
  - payment: 5435
  - patient: 5436
- See `docker-compose.yml`.

## H) Asynchronous communication (RabbitMQ)

**Requirement:** Event-driven flow via RabbitMQ.

**Evidence:**
- RabbitMQ UI: http://localhost:15672
- End-to-end flow (smoke test):
  - Payment notify triggers `payment.completed` event
  - Appointment becomes `CONFIRMED` asynchronously
  - Notification service consumes events and logs notifications

## I) External integration (PayHere-style) + signature validation

**Requirement:** Payment callback validation (signature / checksum).

**Evidence:**
- `POST /api/payments/intents/payhere` returns `formFields` including `merchant_id`, `order_id`, `amount`, `currency`.
- `POST /api/payments/callback/payhere` validates `md5sig`.
- `scripts/smoke-test.ps1` generates a valid `md5sig` and completes the flow.

## J) End-to-end workflow proof

**Requirement:** Demonstrate a realistic workflow across services.

**Evidence:**
- Run: `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1`
- This performs:
  - ADMIN/DOCTOR/PATIENT register or login
  - DOCTOR creates profile
  - ADMIN approves doctor
  - PATIENT creates appointment
  - PATIENT creates payment intent
  - Simulated PayHere notify callback (signed)
  - Appointment transitions to `CONFIRMED`
  - Doctor is confirmed visible in public doctor listing

## K) Swagger / OpenAPI

**Requirement:** API documentation available.

**Evidence:**
- Gateway Swagger UI: http://localhost:8090/swagger
- Direct service swagger (example): http://localhost:8081/swagger-ui/index.html

## L) Kubernetes artifacts

**Requirement:** K8s manifests for deployments/services/config/secrets/ingress.

**Evidence:**
- Folder: `k8s/`
- Key files: `apps.yml`, `configmap.yml`, `secrets.yml`, `postgres.yml`, `rabbitmq.yml`, `ingress.yml`, `namespace.yml`

## M) Frontend UI validation (marker-friendly)

**Requirement:** UI can drive main workflows.

**Evidence:**
- http://localhost:5173
- Screens:
  - Register/Login
  - Doctors (lists VERIFIED)
  - My Doctor Profile (create/update profile)
  - Verify Doctors (admin approval)
  - Appointments (create/list/cancel)
  - Payments (create intent)
  - System Status (health checks)

Note: Newly registered doctors do not appear in Doctors until verified (expected behavior).
