import { createBookingSchema } from "./booking.validation.js";
import { prisma } from "../../lib/prisma.js";

export const createBookingService = async (
    data: unknown,
    patientId: string
) => {
    const validatedData = createBookingSchema.parse(data);

    const { slotId } = validatedData;

    const consultation = await prisma.$transaction(async (tx) => {

        const slotUpdate = await tx.availabilitySlot.updateMany({
            where: {
                id: slotId,
                status: "AVAILABLE"
            },
            data: {
                status: "BOOKED"
            }
        });

        if (slotUpdate.count === 0) {
            const error = new Error("Slot is not available") as Error & {
                statusCode: number;
            };

            error.statusCode = 409;

            throw error;
        }

        const slot = await tx.availabilitySlot.findUnique({
            where: {
                id: slotId
            }
        });

        if (!slot) {
            throw new Error("Slot not found");
        }

        const consultation = await tx.consultation.create({
            data: {
                patientId,
                doctorId: slot.doctorId,
                slotId
            },
            include: {
                doctor: {
                    select: {
                        id: true,
                        specialization: true,
                        qualification: true,
                        consultationFee: true
                    }
                },
                slot: true
            }
        });

        return consultation;
    });

    return consultation;
};