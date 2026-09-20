import { Request, Response } from "express";
import { createPayment, updatePaymentStatus } from "./payment.service.js";

export const createPaymentController = async (req: Request, res: Response) => {
    const payment = await createPayment(req.body, req.user!.id);
    res.status(201).json({
        status: "success",
        message: "payment created successfully",
        data: payment
    });
}

export const updatePaymentStatusController = async (req: Request, res: Response) => {
    const payment = await updatePaymentStatus(
        req.params.paymentId as string,
        req.body
    );

    return res.status(200).json({
        status: "success",
        message: "Payment status updated successfully",
        data: payment,
    });
};