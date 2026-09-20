import { Request, Response } from "express";
import { createBookingService } from "./booking.service.js";

import { prisma } from "../../lib/prisma.js";
import { createHash } from "node:crypto";

export const createBooking = async (
    req: Request,
    res: Response
) => {

    const idempotencyKey = req.headers["idempotency-key"];

    if(!idempotencyKey || typeof idempotencyKey !== "string"){
        return res.status(400).json({
            status: "error",
            message: "Idempotency-key is required"
        });
    }

    const requestHash = createHash('sha256').update(JSON.stringify(req.body)).digest('hex');

    const existingKey = await prisma.idempotencyKey.findUnique({
        where: {
            key: idempotencyKey
        }
    });

    if(existingKey){
        if(existingKey.requestHash != requestHash){
            return res.status(409).json({
                status: "error",
                message: "Idempotency key cannot be reused for a different request"
            });
        }
        if(existingKey.response){
            return res.status(existingKey.status ?? 200).json(existingKey.response);
        }
    }

    const consultation = await createBookingService(
        req.body,
        req.user!.id
    );

     const responseData = {
    status: "success",
    message: "Consultation booked successfully",
    data: consultation
  };

  await prisma.idempotencyKey.create({
    data: {
      key: idempotencyKey,
      userId: req.user!.id,
      requestHash,
      response: JSON.parse(JSON.stringify(responseData)),
      status: 201
    }
  });

  return res.status(201).json(responseData);
};