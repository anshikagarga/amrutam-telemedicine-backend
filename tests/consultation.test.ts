import { describe, it, expect, afterEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { prisma } from "../src/lib/prisma.js";
import app from "../src/app.js";

describe("Consultation API", () => {
    let patientId = "";
    let doctorUserId = "";
    let doctorId = "";
    let slotId = "";
    let consultationId = "";

    afterEach(async () => {
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
    });

    const createTestData = async () => {
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
            doctorUser,
            doctor,
            slot,
            consultation,
        };
    };

    it("should allow patient to view their own consultation", async () => {
        const { patient, consultation } = await createTestData();

        const token = jwt.sign(
            {
                id: patient.id,
                role: "PATIENT",
            },
            process.env.JWT_SECRET!
        );

        const response = await request(app)
            .get(`/api/consultations/${consultation.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data.id).toBe(consultation.id);
    });

    it("should allow assigned doctor to view consultation", async () => {
        const { doctorUser, consultation } = await createTestData();

        const token = jwt.sign(
            {
                id: doctorUser.id,
                role: "DOCTOR",
            },
            process.env.JWT_SECRET!
        );

        const response = await request(app)
            .get(`/api/consultations/${consultation.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data.id).toBe(consultation.id);
    });

    it("should reject patient from updating consultation status", async () => {
        const { patient, consultation } = await createTestData();

        const token = jwt.sign(
            {
                id: patient.id,
                role: "PATIENT",
            },
            process.env.JWT_SECRET!
        );

        const response = await request(app)
            .patch(`/api/consultations/${consultation.id}/status`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                status: "COMPLETED",
            });

        expect(response.status).toBe(403);
        expect(response.body.status).toBe("error");
    });

    it("should allow assigned doctor to update consultation status", async () => {
        const { doctorUser, consultation } = await createTestData();

        const token = jwt.sign(
            {
                id: doctorUser.id,
                role: "DOCTOR",
            },
            process.env.JWT_SECRET!
        );

        const response = await request(app)
            .patch(`/api/consultations/${consultation.id}/status`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                status: "COMPLETED",
            });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("success");
        expect(response.body.data.status).toBe("COMPLETED");
    });
});