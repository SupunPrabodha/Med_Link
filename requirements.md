# MediLink LK – AI-Enabled Telemedicine & Appointment Platform

## 📌 Project Overview

## ✅ Current Implementation Scope (this repository)

This repository is a **runnable microservices skeleton** aligned to the core distributed-systems requirements (Gateway + Discovery + Auth + RBAC + async events + per-service databases + Docker/K8s manifests).

Implemented as runnable services (see `Readme.md` for ports and workflow):
- Service Discovery (Eureka)
- API Gateway (routing + JWT validation + basic RBAC)
- Auth Service (register/login, issues JWT)
- Patient Service (profile + medical reports upload/list/download/delete)
- Doctor Service (onboarding + admin verification)
- Appointment Service (CRUD + appointment lifecycle events)
- Payment Service (PayHere-style intent + notify callback signature validation)
- Notification Service (consumes events, logs notifications)

Implemented UI (minimal, marker-friendly):
- Frontend (React + Vite + Tailwind) under `frontend/`
    - Auth (register/login)
    - Doctor onboarding (submit profile)
    - Admin doctor verification
    - Admin user management (list/search accounts)
    - Admin appointment management (list/cancel platform appointments)
    - Appointment create/list/cancel
    - Payment intent creation
    - System status page (health checks)

Not implemented in this skeleton (kept as **target scope / future extensions** in this document):
- Telemedicine (Jitsi)
- Prescriptions
- AI symptom checker

MediLink LK is a cloud-native, microservices-based healthcare platform designed to facilitate digital medical services including:

- Patient registration and profile management
- Doctor onboarding and verification
- Appointment booking and management
- Telemedicine (video consultations)
- Digital prescription handling
- Medical report uploads
- Payment integration
- Notification system (Email/SMS)
- AI-powered symptom checker (optional enhancement)

This system is designed to follow **distributed systems principles**, using **independent microservices**, **API Gateway**, **asynchronous communication**, and **containerized deployment**.

---

## 🎯 Objectives

- Build a **scalable microservices-based healthcare system**
- Demonstrate **distributed systems architecture**
- Implement **secure role-based access control**
- Integrate **real-world external services**
- Deploy using **Docker and Kubernetes**
- Achieve **production-level system design quality**

---

## 🧠 System Architecture

### Architecture Style
- Microservices Architecture
- API Gateway Pattern
- Event-Driven Communication (RabbitMQ)

### High-Level Components

- Frontend (React)
- API Gateway
- Auth Service
- Patient Service
- Doctor Service
- Appointment Service
- Telemedicine Service
- Payment Service
- Notification Service
- AI Symptom Checker Service (optional)

---

## 🧱 Tech Stack

### Frontend
- React (Vite)
- Tailwind CSS
- Axios (API calls)
- React Router

### Backend (Microservices)
- Java 21
- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Security (JWT)
- Spring Cloud Gateway
- Eureka (Service Discovery)
- OpenFeign (inter-service communication)

### Database
- PostgreSQL (per service or schema-based separation)

### Messaging
- RabbitMQ (event-driven communication)

### External Integrations
- Video: Jitsi Meet
- Payments: PayHere (Sandbox)
- Email: Brevo / Nodemailer
- SMS: Mock or Twilio
- AI: OpenAI API (Symptom Checker)

### DevOps
- Docker
- Docker Compose
- Kubernetes (Minikube or Docker Desktop)

---

## 👥 User Roles

### Patient
- Register/login
- Manage profile
- Search doctors
- Book appointments
- Upload reports
- Join consultations
- View prescriptions

### Doctor
- Register/login
- Submit verification details
- Manage availability
- Conduct consultations
- Issue prescriptions

### Admin
- Verify doctors
- Manage users
- Monitor system activity

---

## 🔐 Authentication & Security

- JWT-based authentication
- Role-Based Access Control (RBAC)
- Password hashing using BCrypt
- Secure file upload handling
- Input validation
- Protected endpoints per role
- API Gateway authentication filtering

---

## 🧩 Microservices Breakdown

### 1. API Gateway
- Central entry point
- Request routing
- Authentication validation

### 2. Auth Service
- User registration/login
- JWT generation
- Role management

### 3. Patient Service
- Patient profile
- Medical reports
- Medical history

### 4. Doctor Service
- Doctor profile
- Specializations
- Availability management

### 5. Appointment Service
- Booking system
- Cancel/reschedule
- Appointment lifecycle tracking

### 6. Telemedicine Service
- Video session creation
- Session management
- Consultation tracking

### 7. Payment Service
- Payment processing
- Transaction validation

### 8. Notification Service
- Email/SMS notifications
- Event-driven alerts

### 9. AI Symptom Checker Service (Optional)
- Analyze symptoms
- Suggest medical specialty

---

## 🔄 Communication Patterns

### Synchronous (REST APIs)
- Gateway → Services
- Service-to-Service validation

### Asynchronous (RabbitMQ)
Events:
- Appointment Created
- Appointment Cancelled
- Payment Completed
- Doctor Verified
- Consultation Completed

Consumers:
- Notification Service
- Patient Service (updates)
- Logging/Audit

---

## 🗄️ Database Strategy

- Each service owns its own data
- Avoid shared database across services
- Use PostgreSQL per service/schema
- Maintain loose coupling

---

## 📁 File Storage

- Medical reports stored in Cloudinary / S3
- Only metadata stored in DB
- Secure access via URLs

---

## 💳 Payment Flow

1. Patient books appointment
2. Payment Service generates payment request
3. Payment provider callback validates transaction
4. Appointment is confirmed
5. Notification triggered

---

## 📹 Telemedicine Flow

1. Appointment confirmed
2. Telemedicine session created
3. Jitsi room generated
4. Patient and doctor join via link
5. Consultation recorded in system

---

## 📩 Notification System

- Triggered via RabbitMQ events
- Email confirmations
- Appointment reminders
- Payment notifications
- Doctor approval alerts

---

## 🤖 AI Symptom Checker

- User inputs symptoms
- AI suggests possible conditions
- Recommends doctor specialty

⚠️ Disclaimer:
- Not for diagnosis
- Only for guidance

---

## 📦 Deployment Strategy

### Docker
- Each service containerized
- Docker Compose for local dev

### Kubernetes
- Deploy all services
- Use:
    - Deployments
    - Services
    - ConfigMaps
    - Secrets
    - Ingress

---

## 📊 Key Workflows

### Appointment Booking
1. Patient searches doctor
2. Selects available slot
3. Books appointment
4. Completes payment
5. Notification sent

### Doctor Verification
1. Doctor registers
2. Admin reviews details
3. Approval/rejection
4. Notification triggered

### Consultation Flow
1. Appointment confirmed
2. Video session created
3. Consultation conducted
4. Prescription issued

---

## 🧪 Testing Strategy

- Unit testing (Spring Boot)
- API testing (Postman)
- Integration testing between services
- Error handling validation

---

## 📚 Documentation Requirements

- Architecture Diagram
- Service Interaction Diagram
- API Specifications (Swagger)
- Workflow Diagrams
- Deployment Architecture (Docker + K8s)

---

## 🚀 Future Enhancements

- Mobile app integration
- Real-time chat
- Analytics dashboard
- EHR integration
- Multi-language support

---

## 🏁 Success Criteria

- Fully working microservices system
- Proper service separation
- Secure authentication and authorization
- External service integration
- Docker + Kubernetes deployment
- Clean UI and user flows
- Professional documentation

---

## ⚠️ Important Notes for Development

- Do NOT build as a monolith
- Keep services independent
- Follow clean architecture principles
- Avoid tight coupling between services
- Focus on stability over unnecessary features
- Ensure all major workflows are fully functional

---

## 🧠 Development Philosophy

This project should reflect:
- Real-world system design
- Scalable architecture thinking
- Clean, maintainable code
- Proper distributed system implementation

---
