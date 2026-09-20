# Amrutam Telemedicine Backend — Architecture Document

## 1. System Overview

Amrutam Telemedicine Backend is a REST API built for a scalable telemedicine platform. The system supports patient and doctor authentication, role-based access control, doctor availability, appointment booking, consultations, prescriptions, payments, audit logging, and operational observability.

### Technology Stack

* **Runtime:** Node.js
* **Language:** TypeScript
* **Framework:** Express.js
* **Database:** PostgreSQL
* **ORM:** Prisma 7
* **Authentication:** JWT
* **Validation:** Zod
* **API Documentation:** OpenAPI / Swagger UI
* **Testing:** Vitest + Supertest
* **Security:** Helmet, CORS, JWT-based authentication, RBAC, rate limiting
* **Observability:** Prometheus-compatible metrics and structured request logging
* **Containerization:** Docker + Docker Compose
* **CI/CD:** GitHub Actions

---

## 2. High-Level Architecture

The application follows a layered REST API architecture.

```text
                    ┌─────────────────────┐
                    │      Client         │
                    │ Web / Mobile / API  │
                    └──────────┬──────────┘
                               │
                               │ HTTPS / REST
                               ▼
                    ┌─────────────────────┐
                    │   Express Server    │
                    │                     │
                    │ Helmet / CORS       │
                    │ Rate Limiting       │
                    │ Request Logging     │
                    │ Metrics             │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │      Routes         │
                    │                     │
                    │ Auth                │
                    │ Doctors             │
                    │ Bookings             │
                    │ Consultations       │
                    │ Prescriptions       │
                    │ Payments             │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Controllers /       │
                    │ Services            │
                    │                     │
                    │ Business Logic      │
                    │ Validation          │
                    │ Authorization       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │      Prisma         │
                    │     ORM Layer       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    PostgreSQL       │
                    │                     │
                    │ Users               │
                    │ Doctors             │
                    │ Availability         │
                    │ Consultations       │
                    │ Prescriptions       │
                    │ Payments             │
                    │ Audit Logs          │
                    │ Idempotency Keys    │
                    └─────────────────────┘
```

---

## 3. Request Flow

A typical API request follows this flow:

```text
Client
  ↓
Express
  ↓
Security Middleware
  ↓
Rate Limiter
  ↓
Request Logger / Metrics
  ↓
Authentication Middleware
  ↓
Role Authorization
  ↓
Route
  ↓
Controller
  ↓
Service / Business Logic
  ↓
Prisma
  ↓
PostgreSQL
  ↓
Response
```

Validation is performed at the API boundary using Zod where applicable.

Errors are passed to the centralized Express error-handling middleware so that API responses follow a consistent error structure.

---

## 4. Database Architecture

PostgreSQL is used as the primary relational database because the application contains strongly related entities and transactional workflows such as appointment booking and payments.

The major entities are:

* `User`
* `Profile`
* `Doctor`
* `AvailabilitySlot`
* `Consultation`
* `Prescription`
* `Payment`
* `AuditLog`
* `IdempotencyKey`

### Important Relationships

```text
User
 ├── Profile
 ├── Doctor
 └── Patient Consultations

Doctor
 └── Availability Slots

Consultation
 ├── Doctor
 ├── Patient
 ├── Availability Slot
 ├── Prescription
 └── Payment

User
 └── Audit Logs

User
 └── Idempotency Keys
```

Indexes are used on frequently queried fields to support doctor search, availability lookup, consultation retrieval, and idempotency operations.

---

## 5. Authentication and Authorization

Authentication uses JSON Web Tokens (JWT).

After successful registration/login, the API issues a JWT containing the authenticated user's identifier and role.

Protected endpoints require:

```text
Authorization: Bearer <JWT>
```

The authentication middleware:

1. Extracts the Bearer token.
2. Verifies the JWT signature.
3. Extracts the user identity and role.
4. Attaches the authenticated user to the request.

Role-based authorization is then applied to protected operations.

Supported roles:

* `PATIENT`
* `DOCTOR`
* `ADMIN`

Examples:

* Patients can create bookings and payments for their consultations.
* Doctors can manage assigned consultations and create prescriptions.
* Administrators can perform administrative payment operations.

---

## 6. Booking, Idempotency and Concurrency

Appointment booking is a critical consistency-sensitive workflow.

The system uses an idempotency key for booking requests.

Example:

```text
Idempotency-Key: booking-123
```

The request is associated with the authenticated user and a request hash.

If the same request is submitted again with the same idempotency key, the previously stored response can be returned instead of creating another booking.

The system also protects the availability slot from double booking.

For concurrent booking attempts against the same slot:

```text
Patient A ──┐
            ├──> Availability Slot ──> One booking succeeds
Patient B ──┘                         Other request rejected
```

Automated tests verify that concurrent requests cannot successfully book the same slot twice.

---

## 7. Consultation and Prescription Flow

After a booking is created, the consultation starts in the `SCHEDULED` state.

The consultation lifecycle is:

```text
SCHEDULED
    │
    ▼
COMPLETED
```

Cancellation is also supported.

Prescription creation is restricted to the doctor associated with the consultation.

A prescription can only be created after the consultation has been completed.

This prevents prescriptions from being created for an appointment that has not yet taken place.

---

## 8. Payment Flow

Payments are associated with consultations.

The basic payment lifecycle is:

```text
PENDING
   │
   ├──> SUCCESS
   │
   ├──> FAILED
   │
   └──> REFUNDED
```

Payment creation is protected by authorization and idempotency checks to prevent duplicate payment records.

Administrative payment status updates are restricted to administrators.

Successful payment operations generate audit information.

---

## 9. Security Architecture

The application includes multiple security layers:

### HTTP Security

Helmet is enabled to apply common HTTP security headers.

### CORS

CORS middleware controls cross-origin API access.

### Authentication

JWT authentication protects private endpoints.

### Authorization

RBAC prevents users from accessing operations outside their assigned role.

### Rate Limiting

The API applies request rate limiting to reduce excessive request traffic and basic abuse.

### Input Validation

Zod schemas validate incoming request data before business logic processes it.

### Password Security

Passwords are stored using secure password hashing rather than storing plaintext passwords.

### Secrets

Environment variables are used for sensitive configuration such as:

* Database connection strings
* JWT secrets

Production deployments should use a dedicated secret-management solution instead of committing secrets to source control.

---

## 10. Observability

The backend provides three primary observability mechanisms.

### Structured Request Logging

Each completed request records information such as:

* HTTP method
* Request path
* HTTP status
* Request duration
* Timestamp

Example:

```json
{
  "method": "GET",
  "path": "/health",
  "statusCode": 200,
  "durationMs": 42,
  "timestamp": "2026-09-20T13:48:14.300Z"
}
```

### Prometheus-Compatible Metrics

The `/metrics` endpoint exposes:

* Total HTTP requests
* HTTP request duration
* Node.js process/runtime metrics

Metrics include labels such as HTTP method, route, and status code.

### Health and Readiness

Two operational endpoints are provided:

```text
GET /health
GET /ready
```

`/health` verifies that the API process is responding.

`/ready` additionally checks database connectivity and returns a non-ready response when the database cannot be reached.

---

## 11. Scalability and Reliability

The architecture is designed to support horizontal scaling of stateless API instances.

Because authentication is token-based and application state is stored in PostgreSQL, additional API instances can serve requests without requiring in-memory session sharing.

For higher production traffic, the architecture can be extended with:

* Load balancers
* Multiple API instances
* PostgreSQL connection pooling
* Read replicas
* Redis caching
* Background workers
* Message queues
* Database partitioning
* Centralized logging
* Distributed tracing

The current implementation establishes the core application and data consistency mechanisms required before introducing these infrastructure components.

---

## 12. Deployment Architecture

The application can be containerized using Docker.

The Docker Compose setup contains:

```text
┌─────────────────────┐
│     API Container   │
│   Node + Express    │
└──────────┬──────────┘
           │
           │ PostgreSQL
           ▼
┌─────────────────────┐
│ PostgreSQL Container│
│  amrutam_telemedicine│
└─────────────────────┘
```

Database migrations are applied during container startup.

GitHub Actions provides CI automation that:

1. Checks out the repository.
2. Starts PostgreSQL.
3. Installs dependencies.
4. Generates the Prisma client.
5. Applies database migrations.
6. Builds the TypeScript application.
7. Runs the automated test suite.

---

## 13. Testing Strategy

The project uses Vitest and Supertest for automated API testing.

The test suite covers:

* Health checks
* Authentication
* RBAC
* Booking
* Idempotency
* Concurrent booking
* Consultations
* Prescriptions
* Payments
* Security
* Rate limiting

The CI pipeline runs the build and test suite automatically for pushes and pull requests targeting `main`.

---

## 14. Current Production Considerations

The current implementation provides the foundation for a production-grade telemedicine backend. Before a production deployment, additional infrastructure and security controls should be introduced, including:

* Strong production secret management
* MFA for appropriate accounts
* Encryption at rest
* Centralized log aggregation
* Distributed tracing
* Production database backup and recovery
* More granular CORS configuration
* Automated idempotency-key cleanup
* Stronger transaction boundaries for multi-step operations
* Production monitoring and alerting
* Load testing against expected traffic

These are deployment-hardening steps rather than requirements for the core API functionality demonstrated by the current implementation.

---

## 15. Conclusion

The Amrutam Telemedicine Backend uses a modular REST architecture with PostgreSQL, Prisma, JWT authentication, RBAC, idempotent booking, concurrency protection, security middleware, automated testing, observability, Docker, and CI automation.

The architecture separates API handling, business logic, persistence, security, and observability concerns, allowing the system to evolve toward a larger production deployment while maintaining a clear and testable codebase.
