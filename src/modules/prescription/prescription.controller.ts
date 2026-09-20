import { Request, Response } from "express";

import { createPrescription } from "./prescription.service.js";

export const createPrescriptionController = async (
  req: Request,
  res: Response
) => {
  const prescription = await createPrescription(
    req.body,
    req.user!.id
  );

  return res.status(201).json({
    status: "success",
    message: "Prescription created successfully",
    data: prescription
  });
};