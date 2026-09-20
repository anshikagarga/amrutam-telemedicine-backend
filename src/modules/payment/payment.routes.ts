import { Router } from "express";
import { createPaymentController, updatePaymentStatusController, } from "./payment.controller.js";

import { authenticate, authorize, } from "../auth/auth.middleware.js";

const router = Router();

router.post(
    "/",
    authenticate,
    authorize(["PATIENT"]),
    createPaymentController
);

router.patch(
    "/:paymentId/status",
    authenticate,
    authorize(["ADMIN"]),
    updatePaymentStatusController
);

export default router;