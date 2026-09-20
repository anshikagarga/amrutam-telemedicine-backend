import {prisma} from "../../lib/prisma.js";
import { updateConsultationStatusSchema } from "./consultation.validation.js";

export const getConsultationById = async(consultationId: string, userId: string, role: string) => {
    const consultation = await prisma.consultation.findUnique({
        where: {
            id: consultationId
        },
        include: {
            patient: {
                select: {
                    id: true,
                    email: true,
                    profile: {
                        select: {
                            firstName: true,
                            lastName: true,
                            phone: true,
                        }
                    }
                }
            },
            doctor: {
                select: {
                    id: true,
                    userId: true,
                    specialization: true,
                    qualification: true,
                    consultationFee: true,
                    user: {
                        select: {
                            email: true,
                            profile: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                }
                            }
                        }
                    }
                }
            },
            slot: true,
            prescription: true,
            payment: true
        }

    });


    if (!consultation) {
    const error = new Error("Consultation not found") as Error & {
      statusCode: number;
    };

    error.statusCode = 404;
    throw error;
  }

  // Patient can access only their own consultation
  if (role === "PATIENT" && consultation.patientId !== userId) {
    const error = new Error("You are not allowed to access this consultation") as Error & {
      statusCode: number;
    };

    error.statusCode = 403;
    throw error;
  }

  // Doctor can access only their own consultations
  if (role === "DOCTOR" && consultation.doctor.userId !== userId) {
    const error = new Error("You are not allowed to access this consultation") as Error & {
      statusCode: number;
    };
    error.statusCode = 403;
    throw error;
}

    return consultation;


}

export const updateConsultationStatus = async (
  consultationId: string,
  status: unknown,
  userId: string
) => {
  const validatedData = updateConsultationStatusSchema.parse(status);

  const consultation = await prisma.consultation.findUnique({
    where: {
      id: consultationId
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

  if (consultation.doctor.userId !== userId) {
    const error = new Error(
      "Only the assigned doctor can update consultation status"
    ) as Error & {
      statusCode: number;
    };

    error.statusCode = 403;
    throw error;
  }

  const updatedConsultation =
    await prisma.consultation.update({
      where: {
        id: consultationId
      },
      data: {
        status: validatedData.status
      }
    });

  return updatedConsultation;
};