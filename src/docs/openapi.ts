
import { OpenAPIV3 } from "openapi-types";

export const openapi: OpenAPIV3.Document = {
  openapi: "3.0.3",

  info: {
    title: "Amrutam Telemedicine API",
    version: "1.0.0",
    description:
      "Backend API for a scalable telemedicine platform with authentication, doctor availability, consultations, prescriptions and payments.",
  },

  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development server",
    },
  ],

  tags: [
    { name: "Health" },
    { name: "Authentication" },
    { name: "Doctors" },
    { name: "Bookings" },
    { name: "Consultations" },
    { name: "Prescriptions" },
    { name: "Payments" },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },

    schemas: {
      Error: {
        type: "object",
        properties: {
          status: {
            type: "string",
            example: "error",
          },
          message: {
            type: "string",
            example: "Unauthorized",
          },
        },
      },

      RegisterRequest: {
        type: "object",
        required: ["email", "password", "firstName"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "patient@example.com",
          },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            example: "password123",
          },
          firstName: {
            type: "string",
            example: "Anshika",
          },
          lastName: {
            type: "string",
            example: "Garg",
          },
          phone: {
            type: "string",
            example: "9876543210",
          },
        },
      },

      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "patient@example.com",
          },
          password: {
            type: "string",
            format: "password",
            example: "password123",
          },
        },
      },

      DoctorRegisterRequest: {
        type: "object",
        required: [
          "email",
          "password",
          "firstName",
          "specialization",
          "qualification",
          "experienceYears",
          "consultationFee",
        ],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "doctor@example.com",
          },
          password: {
            type: "string",
            format: "password",
            minLength: 8,
            example: "password123",
          },
          firstName: {
            type: "string",
            example: "Rahul",
          },
          lastName: {
            type: "string",
            example: "Sharma",
          },
          phone: {
            type: "string",
            example: "9876543211",
          },
          specialization: {
            type: "string",
            example: "Cardiology",
          },
          qualification: {
            type: "string",
            example: "MBBS, MD",
          },
          experienceYears: {
            type: "integer",
            example: 8,
          },
          consultationFee: {
            type: "number",
            example: 800,
          },
          bio: {
            type: "string",
            example: "Experienced cardiologist.",
          },
        },
      },

      AvailabilityRequest: {
        type: "object",
        required: ["startTime", "endTime"],
        properties: {
          startTime: {
            type: "string",
            format: "date-time",
            example: "2026-09-21T10:00:00.000Z",
          },
          endTime: {
            type: "string",
            format: "date-time",
            example: "2026-09-21T11:00:00.000Z",
          },
        },
      },

      BookingRequest: {
        type: "object",
        required: ["slotId"],
        properties: {
          slotId: {
            type: "string",
            format: "uuid",
          },
        },
      },

      ConsultationStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["SCHEDULED", "COMPLETED", "CANCELLED"],
          },
        },
      },

      PrescriptionRequest: {
        type: "object",
        required: ["consultationId", "medicines"],
        properties: {
          consultationId: {
            type: "string",
            format: "uuid",
          },
          medicines: {
            type: "string",
            example: "Paracetamol 500mg",
          },
          instructions: {
            type: "string",
            example: "Take twice daily",
          },
        },
      },

      PaymentRequest: {
        type: "object",
        required: ["consultationId"],
        properties: {
          consultationId: {
            type: "string",
            format: "uuid",
          },
        },
      },

      PaymentStatusRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["SUCCESS", "FAILED", "REFUNDED"],
          },
          transactionId: {
            type: "string",
            example: "txn_123456",
          },
        },
      },
    },
  },

  paths: {
    // =========================
    // HEALTH
    // =========================

    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Service is healthy",
          },
        },
      },
    },

    // =========================
    // AUTHENTICATION
    // =========================

    "/api/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register a patient",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/RegisterRequest",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Patient registered successfully",
          },
          "400": {
            description: "Validation error",
          },
          "409": {
            description: "User already exists",
          },
        },
      },
    },

    "/api/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/LoginRequest",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login successful",
          },
          "401": {
            description: "Invalid credentials",
          },
        },
      },
    },

    // =========================
    // DOCTORS
    // =========================

    "/api/doctors/register-doctor": {
      post: {
        tags: ["Doctors"],
        summary: "Register a doctor",
        security: [{ bearerAuth: [] }],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/DoctorRegisterRequest",
              },
            },
          },
        },

        responses: {
          "201": {
            description: "Doctor registered successfully",
          },
          "400": {
            description: "Validation error",
          },
          "401": {
            description: "Unauthorized",
          },
          "403": {
            description: "Admin access required",
          },
        },
      },
    },

    "/api/doctors/search": {
      get: {
        tags: ["Doctors"],
        summary: "Search doctors",

        parameters: [
          {
            name: "specialization",
            in: "query",
            required: false,
            schema: {
              type: "string",
            },
            example: "Cardiology",
          },
          {
            name: "minExperience",
            in: "query",
            required: false,
            schema: {
              type: "integer",
            },
            example: 5,
          },
          {
            name: "maxFee",
            in: "query",
            required: false,
            schema: {
              type: "number",
            },
            example: 1000,
          },
        ],

        responses: {
          "200": {
            description: "Doctors found",
          },
        },
      },
    },

    "/api/doctors/availability": {
      post: {
        tags: ["Doctors"],
        summary: "Create doctor availability",
        security: [{ bearerAuth: [] }],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AvailabilityRequest",
              },
            },
          },
        },

        responses: {
          "201": {
            description: "Availability created successfully",
          },
          "400": {
            description: "Invalid availability",
          },
          "401": {
            description: "Unauthorized",
          },
          "403": {
            description: "Doctor access required",
          },
        },
      },
    },

    "/api/doctors/{doctorId}": {
      get: {
        tags: ["Doctors"],
        summary: "Get doctor details",

        parameters: [
          {
            name: "doctorId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],

        responses: {
          "200": {
            description: "Doctor details",
          },
          "404": {
            description: "Doctor not found",
          },
        },
      },
    },

    "/api/doctors/{doctorId}/availability": {
      get: {
        tags: ["Doctors"],
        summary: "Get doctor availability",

        parameters: [
          {
            name: "doctorId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],

        responses: {
          "200": {
            description: "Available consultation slots",
          },
          "404": {
            description: "Doctor not found",
          },
        },
      },
    },

    // =========================
    // BOOKINGS
    // =========================

    "/api/bookings": {
      post: {
        tags: ["Bookings"],
        summary: "Book an available consultation slot",
        security: [{ bearerAuth: [] }],

        parameters: [
          {
            name: "Idempotency-Key",
            in: "header",
            required: true,
            schema: {
              type: "string",
            },
            description:
              "Unique key used to safely retry the booking request.",
          },
        ],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/BookingRequest",
              },
            },
          },
        },

        responses: {
          "201": {
            description: "Consultation booked successfully",
          },
          "400": {
            description: "Missing idempotency key",
          },
          "401": {
            description: "Unauthorized",
          },
          "403": {
            description: "Patient access required",
          },
          "409": {
            description: "Slot unavailable or idempotency conflict",
          },
        },
      },
    },

    // =========================
    // CONSULTATIONS
    // =========================

    "/api/consultations/{consultationId}": {
      get: {
        tags: ["Consultations"],
        summary: "Get consultation details",
        security: [{ bearerAuth: [] }],

        parameters: [
          {
            name: "consultationId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],

        responses: {
          "200": {
            description: "Consultation details",
          },
          "401": {
            description: "Unauthorized",
          },
          "403": {
            description: "Access denied",
          },
          "404": {
            description: "Consultation not found",
          },
        },
      },
    },

    "/api/consultations/{consultationId}/status": {
      patch: {
        tags: ["Consultations"],
        summary: "Update consultation status",
        security: [{ bearerAuth: [] }],

        parameters: [
          {
            name: "consultationId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ConsultationStatusRequest",
              },
            },
          },
        },

        responses: {
          "200": {
            description: "Status updated successfully",
          },
          "403": {
            description: "Only assigned doctor can update status",
          },
        },
      },
    },

    // =========================
    // PRESCRIPTIONS
    // =========================

    "/api/prescriptions": {
      post: {
        tags: ["Prescriptions"],
        summary: "Create prescription",
        security: [{ bearerAuth: [] }],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PrescriptionRequest",
              },
            },
          },
        },

        responses: {
          "201": {
            description: "Prescription created successfully",
          },
          "403": {
            description: "Only assigned doctor can create prescription",
          },
          "409": {
            description: "Prescription already exists",
          },
        },
      },
    },

    // =========================
    // PAYMENTS
    // =========================

    "/api/payments": {
      post: {
        tags: ["Payments"],
        summary: "Create payment",
        security: [{ bearerAuth: [] }],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PaymentRequest",
              },
            },
          },
        },

        responses: {
          "201": {
            description: "Payment created successfully",
          },
          "403": {
            description: "Patient does not own consultation",
          },
          "409": {
            description: "Payment already exists",
          },
        },
      },
    },

    "/api/payments/{paymentId}/status": {
      patch: {
        tags: ["Payments"],
        summary: "Update payment status",
        security: [{ bearerAuth: [] }],

        parameters: [
          {
            name: "paymentId",
            in: "path",
            required: true,
            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/PaymentStatusRequest",
              },
            },
          },
        },

        responses: {
          "200": {
            description: "Payment status updated",
          },
          "403": {
            description: "Admin access required",
          },
          "404": {
            description: "Payment not found",
          },
        },
      },
    },
  },
};
