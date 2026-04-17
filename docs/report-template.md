# MediLink LK – Report Template (SE3020 Distributed Systems – Assignment 1)

## 1. Introduction
- Problem statement
- Goals and scope
- Team + responsibilities (brief)

## 2. Architecture (High-level)
- Microservices overview
- Key design decisions (REST + async events)

### 2.1 Architectural Diagram
- Insert a diagram showing:
  - `frontend` → `api-gateway`
  - `service-discovery` (Eureka)
  - Microservices: auth, patient, doctor, appointment, payment, telemedicine, notification, prescription, symptom-checker, ai-symptom-service
  - RabbitMQ event flow
  - Postgres per service

## 3. Service Interfaces (API contracts)
List the main REST interfaces exposed by each service (through the gateway). Keep it readable; include method + path + purpose.

### 3.1 API Gateway
- Routes and RBAC filter behavior (JWT validation + `X-User-Id`/`X-User-Role` headers)

### 3.2 Auth Service
- Register, login
- Admin users listing

### 3.3 Patient Service
- Patient profile
- Medical report upload/list/download/delete

### 3.4 Doctor Service
- Doctor profile
- Availability management
- Admin verify/reject

### 3.5 Appointment Service
- Available slots
- Create/modify/cancel appointments
- Doctor approval endpoints
- Real-time appointment status via SSE

### 3.6 Payment Service
- Payment intent endpoints (PayHere / Stripe)
- Callback/webhook endpoints
- Admin oversight endpoints (review/dispute/refund)

### 3.7 Telemedicine Service
- Session retrieval by appointment
- Consultation completion endpoint

### 3.8 Notification Service
- In-app notifications list
- Admin notification listing

### 3.9 Prescription Service
- Doctor issues prescription
- Patient views prescriptions

### 3.10 Symptom Checker Service (Optional)
- Symptom triage endpoints
- AI inference integration (optional)

## 4. Workflows (Sequence / Design diagrams)
Document the main workflows using sequence diagrams or activity diagrams.

Recommended workflows to include:
1) Patient registration/login
2) Doctor onboarding + admin verification
3) Appointment booking → doctor approval → payment → appointment confirmation
4) Telemedicine session creation → consultation completion → notifications
5) Prescription issuing + patient viewing
6) Patient report upload + doctor viewing (if demonstrated)
7) Real-time appointment updates (SSE)

## 5. Security and Authentication
- JWT issuing (auth-service)
- Gateway enforcement and role checks
- How services trust identity (`X-User-Id`, `X-User-Role`)
- Any additional checks (doctor-only/patient-only/admin-only endpoints)

## 6. Deployment

### 6.1 Docker Compose
- How to run locally
- Key environment variables

### 6.2 Kubernetes
- Applied manifests (`k8s/`)
- Ingress routing
- Readiness/liveness probes (Actuator /health)

## 7. Individual Contributions
- Member A: ...
- Member B: ...
- Member C: ...
- Member D (if any): ...

## 8. Appendix – Code Written (NO screenshots)
Important: paste your code as text (exclude auto-generated code).

Suggested approach:
- Pick the main classes/files each member wrote.
- Include only the relevant custom code portions.
- For each snippet, note the file path and a short purpose line.

## Export to PDF
- Convert this Markdown to PDF using your preferred method (VS Code extension / Pandoc / Word).
- Ensure the final deliverable is named `report.pdf`.
