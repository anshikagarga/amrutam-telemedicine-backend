import {z} from "zod";

export const doctorSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().optional(),
    phone: z.string().min(10).optional(),
    specialization: z.string().min(1),
    qualification: z.string().min(1),
    experienceYears: z.number(),
    consultationFee: z.number(),
    bio: z.string().optional()
    
});

export const availabilitySchema = z.object({
    doctorId: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    
})

