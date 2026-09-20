import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { prisma } from "../src/lib/prisma.js";
import app from "../src/app.js";

describe("Booking API", () => {
    let patientId: string;
    let secondPatientId: string;
    let doctorUserId: string;
    let doctorId: string;
    let slotId: string;
    let idempotencyKey: string;
    let secondIdempotencyKey: string;

    afterEach(async () => {
        // Delete idempotency keys
        if (idempotencyKey) {
            await prisma.idempotencyKey.deleteMany({
                where: { key: idempotencyKey },
            });
        }

        if (secondIdempotencyKey) {
            await prisma.idempotencyKey.deleteMany({
                where: { key: secondIdempotencyKey },
            });
        }

        // Delete consultations
        if (patientId) {
            await prisma.consultation.deleteMany({
                where: { patientId },
            });
        }

        if (secondPatientId) {
            await prisma.consultation.deleteMany({
                where: { patientId: secondPatientId },
            });
        }

        // Delete all slots belonging to the test doctor
        if (doctorId) {
            await prisma.availabilitySlot.deleteMany({
                where: { doctorId },
            });
        }

        // Delete doctor
        if (doctorId) {
            await prisma.doctor.deleteMany({
                where: { id: doctorId },
            });
        }

        // Delete patients
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

        // Delete doctor user
        if (doctorUserId) {
            await prisma.user.deleteMany({
                where: { id: doctorUserId },
            });
        }

        // Reset variables for next test
        patientId = "";
        secondPatientId = "";
        doctorUserId = "";
        doctorId = "";
        slotId = "";
        idempotencyKey = "";
        secondIdempotencyKey = "";
    });

    // --------------------------------------------------
    // TEST 1
    // --------------------------------------------------

    it("should book an available slot", async () => {
        const patient = await prisma.user.create({
            data: {
                email: `test-patient-${Date.now()}@example.com`,
                password: "test-password",
                role: "PATIENT",
            },
        });

        patientId = patient.id;

        const doctorUser = await prisma.user.create({
            data: {
                email: `test-doctor-${Date.now()}@example.com`,
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
            },
        });

        slotId = slot.id;

        const token = jwt.sign(
            {
                id: patient.id,
                role: "PATIENT",
            },
            process.env.JWT_SECRET!
        );

        idempotencyKey = `test-booking-${Date.now()}`;

        const response = await request(app)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${token}`)
            .set("Idempotency-Key", idempotencyKey)
            .send({
                slotId: slot.id,
            });

        expect(response.status).toBe(201);
        expect(response.body.status).toBe("success");
        expect(response.body.data.slotId).toBe(slot.id);

        const updatedSlot = await prisma.availabilitySlot.findUnique({
            where: { id: slot.id },
        });

        expect(updatedSlot?.status).toBe("BOOKED");
    });

    // --------------------------------------------------
    // TEST 2
    // --------------------------------------------------

    it("should return the same response for the same idempotency key", async () => {
        const patient = await prisma.user.create({
            data: {
                email: `test-patient-${Date.now()}@example.com`,
                password: "test-password",
                role: "PATIENT",
            },
        });

        patientId = patient.id;

        const doctorUser = await prisma.user.create({
            data: {
                email: `test-doctor-${Date.now()}@example.com`,
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
            },
        });

        slotId = slot.id;

        const token = jwt.sign(
            {
                id: patient.id,
                role: "PATIENT",
            },
            process.env.JWT_SECRET!
        );

        idempotencyKey = `test-idempotency-${Date.now()}`;

        const firstResponse = await request(app)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${token}`)
            .set("Idempotency-Key", idempotencyKey)
            .send({
                slotId: slot.id,
            });

        const secondResponse = await request(app)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${token}`)
            .set("Idempotency-Key", idempotencyKey)
            .send({
                slotId: slot.id,
            });

        expect(firstResponse.status).toBe(201);
        expect(secondResponse.status).toBe(201);

        expect(secondResponse.body.data.id).toBe(
            firstResponse.body.data.id
        );
    });

    // --------------------------------------------------
    // TEST 3
    // --------------------------------------------------

    it("should reject reusing an idempotency key for a different request", async () => {
        const patient = await prisma.user.create({
            data: {
                email: `test-patient-${Date.now()}@example.com`,
                password: "test-password",
                role: "PATIENT",
            },
        });

        patientId = patient.id;

        const doctorUser = await prisma.user.create({
            data: {
                email: `test-doctor-${Date.now()}@example.com`,
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

        const slot1 = await prisma.availabilitySlot.create({
            data: {
                doctorId: doctor.id,
                startTime: new Date(Date.now() + 60 * 60 * 1000),
                endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
            },
        });

        await prisma.availabilitySlot.create({
            data: {
                doctorId: doctor.id,
                startTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
                endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
            },
        });

        slotId = slot1.id;

        const token = jwt.sign(
            {
                id: patient.id,
                role: "PATIENT",
            },
            process.env.JWT_SECRET!
        );

        idempotencyKey = `test-different-request-${Date.now()}`;

        const firstResponse = await request(app)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${token}`)
            .set("Idempotency-Key", idempotencyKey)
            .send({
                slotId: slot1.id,
            });

        const secondResponse = await request(app)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${token}`)
            .set("Idempotency-Key", idempotencyKey)
            .send({
                slotId: "00000000-0000-0000-0000-000000000000",
            });

        expect(firstResponse.status).toBe(201);
        expect(secondResponse.status).toBe(409);
        expect(secondResponse.body.status).toBe("error");
    });

    // --------------------------------------------------
    // TEST 4
    // --------------------------------------------------

    it("should allow only one patient to book the same slot", async () => {
        const patient1 = await prisma.user.create({
            data: {
                email: `test-patient-1-${Date.now()}@example.com`,
                password: "test-password",
                role: "PATIENT",
            },
        });

        patientId = patient1.id;

        const patient2 = await prisma.user.create({
            data: {
                email: `test-patient-2-${Date.now()}@example.com`,
                password: "test-password",
                role: "PATIENT",
            },
        });

        secondPatientId = patient2.id;

        const doctorUser = await prisma.user.create({
            data: {
                email: `test-doctor-${Date.now()}@example.com`,
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
            },
        });

        slotId = slot.id;

        const token1 = jwt.sign(
            {
                id: patient1.id,
                role: "PATIENT",
            },
            process.env.JWT_SECRET!
        );

        const token2 = jwt.sign(
            {
                id: patient2.id,
                role: "PATIENT",
            },
            process.env.JWT_SECRET!
        );

        idempotencyKey = `concurrent-1-${Date.now()}`;
        secondIdempotencyKey = `concurrent-2-${Date.now()}`;

        const request1 = request(app)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${token1}`)
            .set("Idempotency-Key", idempotencyKey)
            .send({
                slotId: slot.id,
            });

        const request2 = request(app)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${token2}`)
            .set("Idempotency-Key", secondIdempotencyKey)
            .send({
                slotId: slot.id,
            });

        const [response1, response2] = await Promise.all([
            request1,
            request2,
        ]);

        const statuses = [
            response1.status,
            response2.status,
        ].sort();

        expect(statuses).toEqual([201, 409]);
    });
});