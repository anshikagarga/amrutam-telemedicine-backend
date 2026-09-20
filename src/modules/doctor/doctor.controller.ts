import {Request, Response } from "express";
import {createDoctor, getDoctorById, createAvailabilityService, getDoctorAvailability, searchDoctors} from "./doctor.service.js";

export const registerDoctor = async(req: Request, res: Response) => {
    const doctor = await createDoctor(req.body);
    return res.status(201).json({
        status: "success",
        message: "doctor registered successfully",
        data: doctor
    })
}

export const getDoctor = async(req:Request, res: Response) => {
    
    const doctor = await getDoctorById(req.params.doctorId as string);
    return res.status(200).json({
        status: "success",
        data: doctor
    })

}

export const createAvailability = async(req: Request, res: Response) => {
    const slot = await createAvailabilityService(req.body, req.user!.id);
    return res.status(201).json({
        status: "success",
        message: "Availability slot created successfully",
        data: slot
    })
}

export const getAvailability = async(req: Request, res: Response) => {
    const slots = await getDoctorAvailability(req.params.doctorId as string);
    return res.status(200).json({
        status: "success",
        data: slots
    })
}

export const searchDoctorsController = async (
  req: Request,
  res: Response
) => {
  const doctors = await searchDoctors({
    specialization: req.query.specialization as string | undefined,
    minExperience: req.query.minExperience as string | undefined,
    maxFee: req.query.maxFee as string | undefined
  });

  return res.status(200).json({
    status: "success",
    data: doctors
  });
};