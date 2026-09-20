import { z } from "zod";

export const createPrescriptionSchema = z.object({
  consultationId: z.string().uuid(),
  medicines: z.string().min(1),
  instructions: z.string().optional()
});