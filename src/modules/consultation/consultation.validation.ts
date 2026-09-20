import {z} from "zod";

export const updateConsultationStatusSchema = z.object({
    status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"])
});