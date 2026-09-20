# Amrutam Telemedicine Backend — Security Checklist & Threat Model

## 1. Security Overview

The Amrutam Telemedicine Backend handles sensitive healthcare-related application data including user accounts, consultations, prescriptions, doctor information, and payment records.

Security is implemented through multiple layers:

* Authentication
* Role-based authorization
* Input validation
* HTTP security headers
* Rate limiting
* Secure password hashing
* Audit logging
* Environment-based secret configuration
* Database access through Prisma

---

## 2. Security Checklist

### Authentication

* [x] JWT-based authentication
* [x] Bearer token validation
* [x] Invalid JWT rejection
* [x] Missing JWT rejection
* [x] Password hashing
* [x] Password minimum-length validation
* [ ] Multi-factor authentication (MFA)

### Authorization

* [x] Role-based access control
* [x] Patient access restrictions
* [x] Doctor access restrictions
* [x] Admin-only operations
* [x] Consultation ownership/assignment checks
* [x] Prescription authorization checks
* [x] Payment authorization checks

### API Security

* [x] Helmet security headers
* [x] CORS middleware
* [x] Rate limiting
* [x] Request validation with Zod
* [x] Centralized error handling
* [x] JWT-protected private endpoints

### Data Security

* [x] Passwords are hashed
* [x] Database credentials supplied through environment configuration
* [x] JWT secret supplied through environment configuration
* [x] Prisma parameterized database operations
* [ ] Explicit encryption-at-rest configuration
* [ ] Production secret-management system

### Audit and Monitoring

* [x] Audit log model
* [x] Audit events for important operations
* [x] Structured request logging
* [x] Prometheus-compatible metrics
* [x] Health endpoint
* [x] Database readiness endpoint

### Reliability and Abuse Prevention

* [x] Booking idempotency
* [x] Payment idempotency
* [x] Concurrent booking protection
* [x] Rate limiting
* [x] Automated security tests
* [ ] Automated idempotency-key cleanup

---

# 3. Threat Model

## Assets

The primary assets that require protection are:

1. User accounts
2. Authentication credentials
3. JWT credentials
4. Patient information
5. Doctor information
6. Consultation records
7. Prescription information
8. Payment information
9. Audit records
10. Database availability and integrity

---

## 4. Threat: Unauthorized API Access

### Scenario

An attacker attempts to access protected endpoints without authentication or using an invalid JWT.

### Mitigations

* JWT authentication middleware
* Bearer token validation
* Invalid-token rejection
* Protected routes

### Test Coverage

Automated security tests verify that missing and invalid JWTs return HTTP `401`.

---

## 5. Threat: Privilege Escalation

### Scenario

A patient attempts to perform an operation restricted to doctors or administrators.

Examples include:

* Creating a prescription
* Updating administrative payment information
* Accessing another role's protected functionality

### Mitigations

* Role-based authorization middleware
* Resource-level ownership/assignment checks
* Explicit role restrictions

### Test Coverage

Security tests verify that unauthorized roles receive HTTP `403`.

---

## 6. Threat: Duplicate Booking

### Scenario

A client retries a booking request because of a network timeout or sends the same request multiple times.

Without protection, multiple consultations could potentially be created.

### Mitigations

* Idempotency keys
* Request hashing
* Database constraints
* Slot state management

Repeated requests using the same idempotency key can return the previously generated result.

---

## 7. Threat: Concurrent Double Booking

### Scenario

Two patients attempt to book the same doctor availability slot at approximately the same time.

### Risk

Both requests could attempt to reserve the same slot.

### Mitigations

* Transactional database operations
* Availability state checks
* Database constraints
* Concurrency testing

The automated test suite verifies that concurrent attempts do not result in two successful bookings for the same slot.

---

## 8. Threat: Unauthorized Prescription Creation

### Scenario

A patient attempts to create a prescription or a doctor attempts to prescribe for a consultation they are not assigned to.

### Mitigations

The application verifies:

1. The requester is authenticated.
2. The requester has the doctor role.
3. The doctor is assigned to the consultation.
4. The consultation has reached the required completed state.

This prevents prescriptions from being created for unauthorized or incomplete consultations.

---

## 9. Threat: Payment Manipulation

### Scenario

A patient attempts to modify payment status or manipulate another patient's payment.

### Mitigations

* Authentication
* Role-based authorization
* Consultation ownership checks
* Admin-only payment status updates
* Idempotency protection

Automated tests verify that unauthorized payment updates are rejected.

---

## 10. Threat: Credential Brute Force / API Abuse

### Scenario

An attacker repeatedly sends authentication or API requests in an attempt to abuse the service.

### Mitigations

The API uses rate limiting to restrict excessive requests within a configured time window.

Current configuration:

```text id="0p7v0w"
100 requests
per 15-minute window
```

For production, authentication endpoints may require stricter and separately configured limits.

---

## 11. Threat: Malicious Input

### Scenario

An attacker submits malformed or unexpected input to API endpoints.

### Mitigations

* Zod request validation
* TypeScript type checking
* Prisma ORM
* Centralized error handling

The API validates expected input before executing business operations.

---

## 12. Threat: Database Credential Exposure

### Scenario

Database credentials or JWT secrets are accidentally committed to source control.

### Mitigations

* Environment variables
* `.env` excluded through `.gitignore`
* Secrets are not stored in the Git repository
* CI uses dedicated test values

Production deployments should use a dedicated secret-management system.

---

## 13. Threat: Sensitive Operational Information Exposure

### Scenario

Detailed internal information is accidentally returned to API clients through errors.

### Mitigations

* Centralized error handling
* Controlled API error responses
* Server-side logging for operational debugging

Production deployments should additionally ensure that stack traces and internal database errors are not exposed to clients.

---

## 14. Threat: Denial of Service

### Scenario

An attacker sends a large number of requests to consume server resources.

### Current Mitigations

* API rate limiting
* Lightweight health/readiness endpoints
* Stateless API design
* Database indexes for important queries

### Future Production Controls

* API gateway/WAF
* Load balancer
* Distributed rate limiting
* Request-size limits
* Autoscaling
* Infrastructure-level monitoring

---

## 15. Security Testing

The automated security test suite verifies:

* Missing authentication → `401`
* Invalid JWT → `401`
* Unauthorized role access → `403`
* Patient attempting admin payment update → `403`
* Excessive API requests → `429`

Security-related functionality is included in the CI pipeline so that regressions are detected automatically.

---

## 16. Production Security Roadmap

Before production deployment, the following additional controls should be implemented:

1. Multi-factor authentication for sensitive accounts.
2. Production secret management.
3. Encryption at rest for sensitive data.
4. TLS/HTTPS termination.
5. More restrictive CORS configuration.
6. Distributed rate limiting.
7. WAF/API gateway protection.
8. Centralized security monitoring.
9. Automated dependency vulnerability scanning.
10. Regular security audits and penetration testing.
11. Database backup and disaster-recovery procedures.
12. More granular audit trails for administrative operations.

---

## 17. Security Conclusion

The current implementation establishes defense-in-depth at the API level through authentication, authorization, validation, rate limiting, security headers, audit logging, idempotency, concurrency protection, and automated security tests.

The remaining controls listed in the production security roadmap represent additional hardening required before handling production healthcare workloads at scale.
