# MediLink LK – Architecture

## High-level architecture

- **API Gateway (Spring Cloud Gateway)**: single entry point, routing + JWT validation
- **Service Discovery (Eureka)**: dynamic service registry
- **Auth Service**: user registration/login, issues JWT
- **Patient Service (scaffold)**: placeholder service module + DB integration
- **Doctor Service**: onboarding + admin verification
- **Appointment Service**: appointment CRUD, publishes events
- **Payment Service**: payment intents + callback validation, publishes events
- **Notification Service**: consumes appointment events, emits notifications (mocked as logs)
- **RabbitMQ**: asynchronous event-driven communication
- **PostgreSQL**: per-service data ownership (Auth/Patient/Doctor/Appointment/Payment DBs)

## Diagrams (Mermaid)

### Component diagram
```mermaid
flowchart LR
  Client -->|HTTP| GW[API Gateway]
  GW -->|lb://| Auth[Auth Service]
  GW -->|lb://| Pat[Patient Service]
  GW -->|lb://| Doc[Doctor Service]
  GW -->|lb://| Appt[Appointment Service]
  GW -->|lb://| Pay[Payment Service]
  Auth --> AuthDB[(Postgres: authdb)]
  Pat --> PatDB[(Postgres: patientdb)]
  Doc --> DocDB[(Postgres: doctordb)]
  Appt --> ApptDB[(Postgres: appointmentdb)]
  Pay --> PayDB[(Postgres: paymentdb)]
  Appt -->|publish| MQ[(RabbitMQ)]
  Pay -->|publish| MQ
  Doc -->|publish| MQ
  MQ -->|consume| Notif[Notification Service]

  GW <--> Disc[Eureka]
  Auth <--> Disc
  Pat <--> Disc
  Doc <--> Disc
  Appt <--> Disc
  Pay <--> Disc
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

