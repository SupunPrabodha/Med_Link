MediLink LK – Deployment Guide (SE3020 DS Assignment 1)

This repository contains a cloud-native microservices healthcare platform:
- Backend: Java 17 + Spring Boot microservices, Eureka service discovery, Spring Cloud Gateway
- Async messaging: RabbitMQ
- Datastores: PostgreSQL per service
- Frontend: React + Vite (served via Nginx)
- Orchestration: Docker Compose and Kubernetes manifests

Prerequisites
- Git
- Docker Desktop (or Docker Engine + Docker Compose)
- Java 17 (for local non-container runs)
- Node.js 18+ (for local frontend dev)
- kubectl + a Kubernetes cluster (Docker Desktop Kubernetes / Minikube / Kind)

1) Run with Docker Compose (recommended for demo)

1.1 Configure environment
- Copy any provided example env file if available (e.g., .env.example → .env)
- Ensure required secrets are set:
  - JWT secret
  - Stripe keys (sandbox)
  - PayHere sandbox keys (optional)
  - Brevo/Twilio keys (optional)

1.2 Start the stack
- From the repo root:
  docker compose up --build

1.3 Access
- Frontend: http://localhost:5173
- API Gateway: http://localhost:8090
- Swagger UI (Gateway aggregate): http://localhost:8090/swagger

2) Run on Kubernetes

2.1 Create namespace
- Apply namespace manifest:
  kubectl apply -f k8s/namespace.yml

2.2 Apply config + secrets
- Apply configmap:
  kubectl apply -f k8s/configmap.yml
- Apply secrets:
  kubectl apply -f k8s/secrets.yml

2.3 Apply core services
- Deploy apps:
  kubectl apply -f k8s/apps.yml

2.4 Apply ingress (optional)
- Apply ingress:
  kubectl apply -f k8s/ingress.yml
- Add host entry (if needed):
  medilink.local → your cluster ingress IP

2.5 Verify health
- Check pods:
  kubectl get pods -n medilink
- Check readiness/liveness (Actuator):
  Each Spring service exposes /actuator/health

3) Smoke test
- A full end-to-end smoke test script is available:
  scripts/smoke-test.ps1

Notes:
- By default the smoke test runs `docker compose up -d --build`.
- To skip rebuilds (faster on lab machines): set `SMOKE_BUILD=0`.

4) Useful docs
- Requirements mapping: requirements.md
- Architecture: docs/architecture.md

5) Report (PDF)
- The submission report is provided as `report.pdf`.
- To regenerate it from source (`report.html`):
  scripts/build-report.ps1

Notes for marking/demo
- Real-time appointment tracking is implemented using SSE (server-sent events).
- Telemedicine uses Jitsi join URLs.
- AI symptom checker is optional and implemented (with an optional FastAPI inference service).
