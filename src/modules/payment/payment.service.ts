import { prisma } from "../../lib/prisma.js";
import { createAuditLog } from "../audit/audit.service.js";

import { createPaymentSchema, updatePaymentStatusSchema } from "./payment.validation.js";

export const createPayment = async (data: unknown, patientId: string) => {

    const validatedData = await createPaymentSchema.parse(data);
    const consultation = await prisma.consultation.findUnique({
        where: {
            id: validatedData.consultationId,
        },
        include: {
            doctor: true,
            payment: true,
        },
    });

    if (!consultation) {
        const error = new Error("Consultation not found") as Error & { statusCode: number; }
        error.statusCode = 404;
        throw error;
    }

    if (consultation.patientId !== patientId) {
        const error = new Error("only the patient can create payment for this consultation") as Error & { statusCode: number; }
        error.statusCode = 403;
        throw error;
    }

    if (consultation.payment) {
        const error = new Error("Payment already exists for this consultation") as Error & { statusCode: number; }
        error.statusCode = 409;
        throw error;
    }

    const payment = await prisma.payment.create({
        data: {
            consultationId: consultation.id,
            amount: consultation.doctor.consultationFee,
            status: "PENDING",
        }
    });

    return payment;
}

export const updatePaymentStatus = async (paymentId: string, data: unknown) => {
    const validatedData = await updatePaymentStatusSchema.parse(data);

    const payment = await prisma.payment.findUnique({
        where: {
            id: paymentId,
        },
    });

    if (!payment) {
        const error = new Error("Payment not found") as Error & { statusCode: number; }

        error.statusCode = 404;
        throw error;
    }

    

    const updatedPayment = await prisma.payment.update({
        where: {
            id: paymentId,
        },
        data: {
            status: validatedData.status,
            transactionId: validatedData.transactionId,
        },
    });

    if (validatedData.status === "SUCCESS") {
        await createAuditLog({
            action: "PAYMENT_SUCCESS",
            entity: "Payment",
            entityId: updatedPayment.id,
            metadata: {
                consultationId: updatedPayment.consultationId,
                amount: updatedPayment.amount.toString(),
                transactionId: updatedPayment.transactionId,
            },
        });
    }

    return updatedPayment;

}