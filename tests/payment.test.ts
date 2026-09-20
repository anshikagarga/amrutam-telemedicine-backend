import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { prisma } from "../src/lib/prisma.js";
import app from "../src/app.js";

describe("Payment API", () => {
  let patientId = "";
  let secondPatientId = "";
  let adminId = "";
  let doctorUserId = "";
  let doctorId = "";
  let slotId = "";
  let consultationId = "";
  let paymentId = "";

  afterEach(async () => {
    if (paymentId) {
      await prisma.payment.deleteMany({
        where: { id: paymentId },
      });
    }

    if (consultationId) {
      await prisma.consultation.deleteMany({
        where: { id: consultationId },
      });
    }

    if (slotId) {
      await prisma.availabilitySlot.deleteMany({
        where: { id: slotId },
      });
    }

    if (doctorId) {
      await prisma.doctor.deleteMany({
        where: { id: doctorId },
      });
    }

    if (patientId) {
      await prisma.user.deleteMany({
        where: { id: patientId },
      });
    }

    if (secondPatientId) {
      await prisma.user.deleteMany({
        where: { id: secondPatientId },
      });
    }

    if (adminId) {
      await prisma.user.deleteMany({
        where: { id: adminId },
      });
    }

    if (doctorUserId) {
      await prisma.user.deleteMany({
        where: { id: doctorUserId },
      });
    }

    patientId = "";
    secondPatientId = "";
    adminId = "";
    doctorUserId = "";
    doctorId = "";
    slotId = "";
    consultationId = "";
    paymentId = "";
  });

  const createTestData = async () => {
    const patient = await prisma.user.create({
      data: {
        email: `test-patient-${Date.now()}-${Math.random()}@example.com`,
        password: "test-password",
        role: "PATIENT",
      },
    });

    patientId = patient.id;

    const secondPatient = await prisma.user.create({
      data: {
        email: `test-patient-2-${Date.now()}-${Math.random()}@example.com`,
        password: "test-password",
        role: "PATIENT",
      },
    });

    secondPatientId = secondPatient.id;

    const doctorUser = await prisma.user.create({
      data: {
        email: `test-doctor-${Date.now()}-${Math.random()}@example.com`,
        password: "test-password",
        role: "DOCTOR",
      },
    });

    doctorUserId = doctorUser.id;

    const doctor = await prisma.doctor.create({
      data: {
        userId: doctorUser.id,
        specialization: "General Medicine",
        qualification: "MBBS",
        experienceYears: 5,
        consultationFee: 500,
      },
    });

    doctorId = doctor.id;

    const slot = await prisma.availabilitySlot.create({
      data: {
        doctorId: doctor.id,
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        status: "BOOKED",
      },
    });

    slotId = slot.id;

    const consultation = await prisma.consultation.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        slotId: slot.id,
        status: "SCHEDULED",
      },
    });

    consultationId = consultation.id;

    return {
      patient,
      secondPatient,
      doctorUser,
      doctor,
      slot,
      consultation,
    };
  };

  it("should allow patient to create payment", async () => {
    const { patient, consultation } = await createTestData();

    const token = jwt.sign(
      {
        id: patient.id,
        role: "PATIENT",
      },
      process.env.JWT_SECRET!
    );

    const response = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        consultationId: consultation.id,
      });

    expect(response.status).toBe(201);
    expect(response.body.status).toBe("success");
    expect(response.body.data.consultationId).toBe(
      consultation.id
    );
    expect(response.body.data.status).toBe("PENDING");

    paymentId = response.body.data.id;
  });

  it("should reject another patient from creating payment", async () => {
    const { secondPatient, consultation } = await createTestData();

    const token = jwt.sign(
      {
        id: secondPatient.id,
        role: "PATIENT",
      },
      process.env.JWT_SECRET!
    );

    const response = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        consultationId: consultation.id,
      });

    expect(response.status).toBe(403);
    expect(response.body.status).toBe("error");
  });

  it("should reject duplicate payment for the same consultation", async () => {
    const { patient, consultation } = await createTestData();

    const token = jwt.sign(
      {
        id: patient.id,
        role: "PATIENT",
      },
      process.env.JWT_SECRET!
    );

    const firstResponse = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        consultationId: consultation.id,
      });

    expect(firstResponse.status).toBe(201);

    paymentId = firstResponse.body.data.id;

    const secondResponse = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        consultationId: consultation.id,
      });

    expect(secondResponse.status).toBe(409);
    expect(secondResponse.body.status).toBe("error");
  });

  it("should allow admin to update payment status", async () => {
    const { patient, consultation } = await createTestData();

    const patientToken = jwt.sign(
      {
        id: patient.id,
        role: "PATIENT",
      },
      process.env.JWT_SECRET!
    );

    const createResponse = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        consultationId: consultation.id,
      });

    expect(createResponse.status).toBe(201);

    paymentId = createResponse.body.data.id;

    const admin = await prisma.user.create({
      data: {
        email: `test-admin-${Date.now()}-${Math.random()}@example.com`,
        password: "test-password",
        role: "ADMIN",
      },
    });

    adminId = admin.id;

    const adminToken = jwt.sign(
      {
        id: admin.id,
        role: "ADMIN",
      },
      process.env.JWT_SECRET!
    );

    const response = await request(app)
      .patch(`/api/payments/${paymentId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "SUCCESS",
        transactionId: `txn-${Date.now()}`,
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("success");
    expect(response.body.data.status).toBe("SUCCESS");
  });

  it("should reject patient from updating payment status", async () => {
    const { patient, consultation } = await createTestData();

    const patientToken = jwt.sign(
      {
        id: patient.id,
        role: "PATIENT",
      },
      process.env.JWT_SECRET!
    );

    const createResponse = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        consultationId: consultation.id,
      });

    expect(createResponse.status).toBe(201);

    paymentId = createResponse.body.data.id;

    const response = await request(app)
      .patch(`/api/payments/${paymentId}/status`)
      .set("Authorization", `Bearer ${patientToken}`)
      .send({
        status: "SUCCESS",
        transactionId: `txn-${Date.now()}`,
      });

    expect(response.status).toBe(403);
    expect(response.body.status).toBe("error");
  });
});