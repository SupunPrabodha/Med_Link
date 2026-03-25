# MediLink LK – Architecture

## High-level architecture

- **API Gateway (Spring Cloud Gateway)**: single entry point, routing + JWT validation
- **Service Discovery (Eureka)**: dynamic service registry
- **Auth Service**: user registration/login, issues JWT
- **Appointment Service**: appointment CRUD, publishes events
- **Notification Service**: consumes appointment events, emits notifications (mocked as logs)
- **RabbitMQ**: asynchronous event-driven communication
- **PostgreSQL**: per-service data ownership (Auth DB + Appointment DB)

## Diagrams (Mermaid)

### Component diagram
```mermaid
flowchart LR
  Client -->|HTTP| GW[API Gateway]
  GW -->|lb://| Auth[Auth Service]
  GW -->|lb://| Appt[Appointment Service]
  Auth --> AuthDB[(Postgres: authdb)]
  Appt --> ApptDB[(Postgres: appointmentdb)]
  Appt -->|publish| MQ[(RabbitMQ)]
  MQ -->|consume| Notif[Notification Service]

  GW <--> Disc[Eureka]
  Auth <--> Disc
  Appt <--> Disc
  Notif <--> Disc
```

### Appointment booking workflow
```mermaid
sequenceDiagram
  participant P as Patient
  participant G as API Gateway
  participant A as Auth Service
  participant S as Appointment Service
  participant M as RabbitMQ
  participant N as Notification Service

  P->>G: POST /api/auth/register or /login
  G->>A: forward
  A-->>P: JWT

  P->>G: POST /api/appointments (Bearer JWT)
  G->>S: forward + X-User-Id
  S->>M: publish appointment.created
  M->>N: deliver message
  N-->>N: log/send mocked email
```

