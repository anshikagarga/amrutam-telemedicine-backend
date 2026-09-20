import { z } from "zod";

export const createPaymentSchema = z.object({
  consultationId: z.string().uuid(),
});

export const updatePaymentStatusSchema = z.object({
  status: z.enum(["SUCCESS", "FAILED", "REFUNDED"]),
  transactionId: z.string().min(1).optional(),
});