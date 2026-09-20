import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { prisma } from "../src/lib/prisma.js";
import app from "../src/app.js";
import crypto from "crypto";

describe("Prescription API", () => {
    let patientId = "";
    let doctorUserId = "";
    let doctorId = "";
    let slotId = "";
    let consultationId = "";
    let prescriptionId = "";

    afterEach(async () => {
        if (prescriptionId) {
            await prisma.prescription.deleteMany({
                where: { id: prescriptionId },
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

        if (doctorUserId) {
            await prisma.user.deleteMany({
                where: { id: doctorUserId },
            });
        }

        patientId = "";
        doctorUserId = "";
        doctorId = "";
        slotId = "";
        consultationId = "";
        prescriptionId = "";
    });

    const createTestData = async (completed = true) => {
        const patient = await prisma.user.create({
            data: {
               email: `test-patient-${crypto.randomUUID()}@example.com`,
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
                status: "BOOKED",
            },
        });

        slotId = slot.id;

        const consultation = await prisma.consultation.create({
            data: {
                patientId: patient.id,
                doctorId: doctor.id,
                slotId: slot.id,
                status: completed ? "COMPLETED" : "SCHEDULED",
            },
        });

        consultationId = consultation.id;

        return {
            patient,
            doctorUser,
            doctor,
            slot,
            consultation,
        };
    };

    it("should allow assigned doctor to create a prescription", async () => {
        const { doctorUser, consultation } = await createTestData();

        const token = jwt.sign(
            {
                id: doctorUser.id,
                role: "DOCTOR",
            },
            process.env.JWT_SECRET!
        );

        const response = await request(app)
            .post("/api/prescriptions")
            .set("Authorization", `Bearer ${token}`)
            .send({
                consultationId: consultation.id,
                medicines: "Paracetamol 500mg",
                instructions: "Take twice daily",
            });

        expect(response.status).toBe(201);
        expect(response.body.status).toBe("success");
        expect(response.body.data.consultationId).toBe(consultation.id);

        prescriptionId = response.body.data.id;
    });

    it("should reject patient from creating a prescription", async () => {
        const { patient, consultation } = await createTestData();

        const token = jwt.sign(
            {
                id: patient.id,
                role: "PATIENT",
            },
            process.env.JWT_SECRET!
        );

        const response = await request(app)
            .post("/api/prescriptions")
            .set("Authorization", `Bearer ${token}`)
            .send({
                consultationId: consultation.id,
                medicines: "Paracetamol 500mg",
                instructions: "Take twice daily",
            });

        expect(response.status).toBe(403);
        expect(response.body.status).toBe("error");
    });

    it("should reject prescription before consultation is completed", async () => {
        const { doctorUser, consultation } = await createTestData(false);

        const token = jwt.sign(
            {
                id: doctorUser.id,
                role: "DOCTOR",
            },
            process.env.JWT_SECRET!
        );

        const response = await request(app)
            .post("/api/prescriptions")
            .set("Authorization", `Bearer ${token}`)
            .send({
                consultationId: consultation.id,
                medicines: "Paracetamol 500mg",
                instructions: "Take twice daily",
            });

        expect(response.status).toBe(400);
        expect(response.body.status).toBe("error");
    });

    it("should reject duplicate prescription for the same consultation", async () => {
        const { doctorUser, consultation } = await createTestData();

        const token = jwt.sign(
            {
                id: doctorUser.id,
                role: "DOCTOR",
            },
            process.env.JWT_SECRET!
        );

        const firstResponse = await request(app)
            .post("/api/prescriptions")
            .set("Authorization", `Bearer ${token}`)
            .send({
                consultationId: consultation.id,
                medicines: "Paracetamol 500mg",
                instructions: "Take twice daily",
            });

        expect(firstResponse.status).toBe(201);

        prescriptionId = firstResponse.body.data.id;

        const secondResponse = await request(app)
            .post("/api/prescriptions")
            .set("Authorization", `Bearer ${token}`)
            .send({
                consultationId: consultation.id,
                medicines: "Paracetamol 500mg",
                instructions: "Take twice daily",
            });

        expect(secondResponse.status).toBe(409);
        expect(secondResponse.body.status).toBe("error");
    });
});