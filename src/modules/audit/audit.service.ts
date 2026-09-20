import { prisma } from "../../lib/prisma.js";
import type { Prisma } from "../../generated/prisma/client.js";

interface CreateAuditLogData {
    userId?: string;
    action:
    | "USER_LOGIN"
    | "USER_REGISTERED"
    | "CONSULTATION_BOOKED"
    | "CONSULTATION_CANCELLED"
    | "PRESCRIPTION_CREATED"
    | "PAYMENT_SUCCESS"
    | "PAYMENT_FAILED";
    entity: string;
    entityId?: string;
    metadata?: Prisma.InputJsonValue;
}

export const createAuditLog = async (data: CreateAuditLogData) => {
    return prisma.auditLog.create({
        data: {
            userId: data.userId,
            action: data.action,
            entity: data.entity,
            entityId: data.entityId,
            metadata: data.metadata,
        },
    });
};