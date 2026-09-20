import { prisma } from "../../lib/prisma.js";
import { createAuditLog } from "../audit/audit.service.js";
import { createPrescriptionSchema } from "./prescription.validation.js";

export const createPrescription = async (
  data: unknown,
  doctorUserId: string
) => {
  const validatedData = createPrescriptionSchema.parse(data);

  const consultation = await prisma.consultation.findUnique({
    where: {
      id: validatedData.consultationId
    },
    include: {
      doctor: true
    }
  });

  if (!consultation) {
    const error = new Error("Consultation not found") as Error & {
      statusCode: number;
    };

    error.statusCode = 404;
    throw error;
  }

  if (consultation.doctor.userId !== doctorUserId) {
    const error = new Error(
      "Only the assigned doctor can create prescription"
    ) as Error & {
      statusCode: number;
    };

    error.statusCode = 403;
    throw error;
  }

  if (consultation.status !== "COMPLETED") {
    const error = new Error(
      "Prescription can only be created for a completed consultation"
    ) as Error & {
      statusCode: number;
    };

    error.statusCode = 400;
    throw error;
  }

  const existingPrescription =
    await prisma.prescription.findUnique({
      where: {
        consultationId: validatedData.consultationId
      }
    });

  if (existingPrescription) {
    const error = new Error(
      "Prescription already exists for this consultation"
    ) as Error & {
      statusCode: number;
    };

    error.statusCode = 409;
    throw error;
  }

  const prescription = await prisma.prescription.create({
    data: {
      consultationId: consultation.id,
      doctorId: consultation.doctorId,
      patientId: consultation.patientId,
      medicines: validatedData.medicines,
      instructions: validatedData.instructions
    }
  });

  await createAuditLog({
    userId: doctorUserId,
    action: "PRESCRIPTION_CREATED",
    entity: "Prescription",
    entityId: prescription.id,
    metadata: {
      consultationId: consultation.id,
      patientId: consultation.patientId,
    },
  });

  return prescription;
};