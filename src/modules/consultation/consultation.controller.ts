import { Request, Response } from "express";

import {
  getConsultationById,
  updateConsultationStatus
} from "./consultation.service.js";

export const getConsultation = async (
  req: Request,
  res: Response
) => {
  const consultation = await getConsultationById(
    req.params.consultationId as string,
    req.user!.id,
    req.user!.role
  );

  return res.status(200).json({
    status: "success",
    data: consultation
  });
};

export const updateStatus = async (
  req: Request,
  res: Response
) => {
  const consultation = await updateConsultationStatus(
    req.params.consultationId as string,
    req.body,
    req.user!.id
  );

  return res.status(200).json({
    status: "success",
    message: "Consultation status updated successfully",
    data: consultation
  });
};