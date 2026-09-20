import { registerSchema, loginSchema } from "./auth.validation.js";
import { prisma } from "../../lib/prisma.js"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (data: unknown) => {
    const validatedData = registerSchema.parse(data);
    const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
    });
    if (existingUser) {
        const error = new Error("User already exists") as Error & {
            statusCode?: number;
        };

        error.statusCode = 409;
        throw error;
    }
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
        data: {
            email: validatedData.email,
            password: hashedPassword,
            profile: {
                create: {
                    firstName: validatedData.firstName,
                    lastName: validatedData.lastName,
                    phone: validatedData.phone
                }
            }
        }
    })
    return {
        id: user.id,
        email: user.email
    }
}

export const loginUser = async (data: unknown) => {
    const validateData = loginSchema.parse(data);
    const user = await prisma.user.findUnique({
        where: {
            email: validateData.email
        }
    })

    if (!user) {
        throw new Error("Invalid user or email");
    }

    const isPasswordValid = await bcrypt.compare(
        validateData.password,
        user.password
    )

    if (!isPasswordValid) {
        throw new Error("invalid email or password");
    }

    const token = jwt.sign(
        {
            id: user.id,
            role: user.role,
        },
        process.env.JWT_SECRET!,
        {
            expiresIn: "1d"
        }
    )

    return {
        id: user.id,
        email: user.email,
        token

    }

}