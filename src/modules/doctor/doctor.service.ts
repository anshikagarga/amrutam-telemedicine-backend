import bcrypt from "bcrypt";

import { availabilitySchema, doctorSchema } from "./doctor.validation.js";

import { prisma } from "../../lib/prisma.js";




export const createDoctor = async (data: unknown) => {

    const validatedData = doctorSchema.parse(data);

    const hashPasswordValid = await bcrypt.hash(
        validatedData.password,
        10
    );

    const doctor = await prisma.$transaction(async (tx) => {

        const user = await tx.user.create({
            data: {
                email: validatedData.email,
                password: hashPasswordValid,
                role: "DOCTOR"
            }
        });

        await tx.profile.create({
            data: {
                userId: user.id,
                firstName: validatedData.firstName,
                lastName: validatedData.lastName,
                phone: validatedData.phone
            }
        });

        const doctor = await tx.doctor.create({
            data: {
                userId: user.id,
                specialization: validatedData.specialization,
                qualification: validatedData.qualification,
                experienceYears: validatedData.experienceYears,
                consultationFee: validatedData.consultationFee,
                bio: validatedData.bio
            }
        });

        return doctor;
    });

    return doctor;
};




export const getDoctorById = async (doctorId: string) => {

    const doctor = await prisma.doctor.findUnique({
        where: {
            id: doctorId
        },

        select: {
            id: true,
            userId: true,
            specialization: true,
            qualification: true,
            experienceYears: true,
            consultationFee: true,
            bio: true,
            isVerified: true,

            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,

                    profile: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            phone: true
                        }
                    }
                }
            }
        }
    });

    return doctor;
};




export const createAvailabilityService = async (
    data: unknown,
    userId: string
) => {

    const validatedData = availabilitySchema.parse(data);

    // Find doctor belonging to authenticated user
    const doctor = await prisma.doctor.findUnique({
        where: {
            userId: userId
        }
    });

    if (!doctor) {
        throw new Error("Doctor not found");
    }

    const startTime = new Date(validatedData.startTime);
    const endTime = new Date(validatedData.endTime);

    // Validate time range
    if (startTime >= endTime) {
        throw new Error("Start time must be before end time");
    }

    // Check overlapping slot
    const existingSlot = await prisma.availabilitySlot.findFirst({
        where: {
            doctorId: doctor.id,

            startTime: {
                lte: endTime
            },

            endTime: {
                gte: startTime
            }
        }
    });

    if (existingSlot) {
        throw new Error(
            "Availability slot overlaps with an existing slot"
        );
    }

    // Create availability slot
    const slot = await prisma.availabilitySlot.create({
        data: {
            doctorId: doctor.id,
            startTime,
            endTime
        }
    });

    return slot;
};




export const getDoctorAvailability = async (
    doctorId: string
) => {

    const slots = await prisma.availabilitySlot.findMany({
        where: {
            doctorId: doctorId,

            status: "AVAILABLE",

            startTime: {
                gte: new Date()
            }
        },

        orderBy: {
            startTime: "asc"
        }
    });

    return slots;
};




export const searchDoctors = async (filters: {
    specialization?: string;
    minExperience?: string;
    maxFee?: string;
}) => {

    const {
        specialization,
        minExperience,
        maxFee
    } = filters;

    const doctors = await prisma.doctor.findMany({

        where: {

            ...(specialization && {
                specialization: {
                    contains: specialization,
                    mode: "insensitive"
                }
            }),

            ...(minExperience && {
                experienceYears: {
                    gte: Number(minExperience)
                }
            }),

            ...(maxFee && {
                consultationFee: {
                    lte: Number(maxFee)
                }
            })
        },

        select: {
            id: true,
            specialization: true,
            qualification: true,
            experienceYears: true,
            consultationFee: true,
            bio: true,
            isVerified: true,

            user: {
                select: {
                    profile: {
                        select: {
                            firstName: true,
                            lastName: true
                        }
                    }
                }
            }
        },

        orderBy: {
            experienceYears: "desc"
        }
    });

    return doctors;
};