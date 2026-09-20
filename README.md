# Amrutam Telemedicine Backend

A production-oriented REST API backend for a scalable telemedicine platform.

The system provides authentication, role-based access control, doctor availability, appointment booking, consultations, prescriptions, payments, audit logging, observability, automated testing, Docker deployment, and CI automation.

---

## Features

### Authentication & Authorization

* Patient, Doctor, and Admin roles
* JWT-based authentication
* Role-based access control
* Password hashing
* Zod request validation
* Protected API routes

### Doctor & Availability

* Doctor registration
* Doctor search
* Doctor profile retrieval
* Availability slot management
* Availability lookup

### Booking

* Appointment booking
* Idempotency protection
* Duplicate-request protection
* Concurrent booking protection
* Consultation creation

### Consultations

* Patient consultation access
* Doctor consultation access
* Consultation status management
* Consultation lifecycle validation

### Prescriptions

* Doctor-only prescription creation
* Consultation assignment validation
* Prescription status management
* Prescription audit logging

### Payments

* Consultation-linked payments
* Idempotent payment creation
* Payment status management
* Admin-only payment status updates
* Payment audit logging

### Security

* Helmet
* CORS
* JWT authentication
* RBAC
* Rate limiting
* Input validation
* Centralized error handling
* Security test coverage

### Observability

* Structured request logging
* Prometheus-compatible metrics
* HTTP request counters
* HTTP request duration metrics
* Node.js runtime metrics
* Health checks
* Database readiness checks

---

## Technology Stack

| Technology        | Purpose                       |
| ----------------- | ----------------------------- |
| Node.js           | Runtime                       |
| TypeScript        | Application language          |
| Express.js        | REST API framework            |
| PostgreSQL        | Relational database           |
| Prisma 7          | ORM                           |
| JWT               | Authentication                |
| Zod               | Request validation            |
| Swagger / OpenAPI | API documentation             |
| Vitest            | Testing                       |
| Supertest         | API testing                   |
| Helmet            | HTTP security                 |
| Prometheus Client | Metrics                       |
| Docker            | Containerization              |
| Docker Compose    | Local container orchestration |
| GitHub Actions    | CI                            |

---

## Architecture

```text
Client
  │
  ▼
Express API
  │
  ├── Security Middleware
  ├── Rate Limiting
  ├── Request Logging
  └── Metrics
  │
  ▼
Routes
  │
  ▼
Controllers / Services
  │
  ├── Authentication
  ├── Doctors
  ├── Bookings
  ├── Consultations
  ├── Prescriptions
  └── Payments
  │
  ▼
Prisma
  │
  ▼
PostgreSQL
```

Detailed architecture documentation is available in:

```text
docs/architecture.md
```

Security checklist and threat model:

```text
docs/security.md
```

---

## Database

The main entities include:

* User
* Profile
* Doctor
* AvailabilitySlot
* Consultation
* Prescription
* Payment
* AuditLog
* IdempotencyKey

Prisma migrations are used to manage database schema changes.

---

## API Documentation

Swagger UI is available at:

```text
GET /api-docs
```

When running locally:

```text
http://localhost:5000/api-docs
```

The OpenAPI definition documents authentication, doctors, availability, bookings, consultations, prescriptions, and payments.

---

## Health & Observability Endpoints

### Health

```text
GET /health
```

Checks whether the API is responding.

### Readiness

```text
GET /ready
```

Checks API readiness and PostgreSQL connectivity.

### Metrics

```text
GET /metrics
```

Exposes Prometheus-compatible application and runtime metrics.

---

## Getting Started

### Prerequisites

Install:

* Node.js 22+
* PostgreSQL 18+
* npm
* Git

Docker can be used instead of installing PostgreSQL locally.

---

## 1. Clone the Repository

```bash
git clone https://github.com/anshikagarga/amrutam-telemedicine-backend.git
cd amrutam-telemedicine-backend
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/amrutam_telemedicine"
JWT_SECRET="your-development-secret"
PORT=5000
```

Do not commit `.env` to source control.

---

## 4. Generate Prisma Client

```bash
npx prisma generate
```

---

## 5. Run Database Migrations

```bash
npx prisma migrate deploy
```

For development environments where migrations need to be created:

```bash
npx prisma migrate dev
```

---

## 6. Start the Server

Development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Run the compiled application:

```bash
node dist/server.js
```

The API runs on:

```text
http://localhost:5000
```

---

# Docker

The project includes Docker and Docker Compose configuration.

Start the complete application:

```bash
docker compose up --build
```

The API will be available at:

```text
http://localhost:5001
```

Swagger:

```text
http://localhost:5001/api-docs
```

Health:

```text
http://localhost:5001/health
```

Metrics:

```text
http://localhost:5001/metrics
```

Stop containers:

```bash
docker compose down
```

---

# Testing

The project uses Vitest and Supertest.

Run the complete test suite:

```bash
npm test
```

The test suite covers:

* Authentication
* RBAC
* Booking
* Booking idempotency
* Concurrent booking
* Consultations
* Prescriptions
* Payments
* Security
* Rate limiting
* Health checks

---

# CI/CD

GitHub Actions automatically runs the following pipeline:

```text
Checkout
   ↓
Node.js setup
   ↓
Install dependencies
   ↓
PostgreSQL service
   ↓
Prisma generation
   ↓
Database migrations
   ↓
TypeScript build
   ↓
Automated tests
```

The workflow runs for pushes and pull requests targeting `main`.

---

# Project Structure

```text
amrutam-telemedicine-backend/
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── docs/
│   ├── architecture.md
│   └── security.md
│
├── prisma/
│   ├── migrations/
│   └── schema.prisma
│
├── src/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── observability/
│   ├── docs/
│   ├── generated/
│   └── server.ts
│
├── tests/
│
├── Dockerfile
├── docker-compose.yml
├── package.json
├── prisma7.config.ts
└── README.md
```

---

# API Modules

| Module         | Endpoint Prefix      |
| -------------- | -------------------- |
| Authentication | `/api/auth`          |
| Doctors        | `/api/doctors`       |
| Bookings       | `/api/bookings`      |
| Consultations  | `/api/consultations` |
| Prescriptions  | `/api/prescriptions` |
| Payments       | `/api/payments`      |

---

# Reliability & Scalability

The application is designed with production scalability in mind.

Current mechanisms include:

* Stateless JWT authentication
* PostgreSQL relational persistence
* Database indexes
* Booking idempotency
* Concurrency protection
* API rate limiting
* Health/readiness checks
* Structured logging
* Prometheus-compatible metrics
* Automated CI testing
* Docker containerization

Potential production extensions include:

* Load balancing
* Horizontal API scaling
* Redis caching
* PostgreSQL read replicas
* Background workers
* Message queues
* Distributed tracing
* Centralized logging
* Database partitioning
* Autoscaling

---

# Security

The project includes:

* JWT authentication
* RBAC
* Helmet
* CORS
* Rate limiting
* Zod validation
* Password hashing
* Audit logging
* Security tests
* Environment-based secrets

Additional production hardening is documented in:

```text
docs/security.md
```

---

# Testing & Quality

The backend was tested through both automated API tests and manual Swagger API flows.

Important workflows verified include:

```text
Patient Registration
       ↓
Login
       ↓
Doctor / Availability
       ↓
Booking
       ↓
Consultation
       ↓
Prescription
       ↓
Payment
       ↓
Admin Payment Update
```

---

# License

This project was developed as a backend engineering assignment and portfolio project.
